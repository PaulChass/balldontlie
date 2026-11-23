import React, { useState, useCallback } from 'react';

/**
 * Assistant IA scopé à UN match, affiché dans l'onglet « Proba & IA » du
 * Face-à-Face. Deux usages :
 *   - un debrief du match généré À LA DEMANDE (bouton),
 *   - un chat dont chaque question est analysée dans le contexte de ce match
 *     (ses deux équipes et leurs joueurs). Chat sans mémoire : chaque question
 *     est indépendante mais scopée au match côté agent.
 *
 * Tout passe par le proxy Symfony (/api/nba/match-preview et /api/nba/ask) :
 * la clé Anthropic ne touche jamais le navigateur. Ton analytique, chaque
 * chiffre sourcé — jamais un conseil de mise.
 *
 * props :
 *   - teams      : [homeTeamId, awayTeamId] (ids NBA)
 *   - hTeamName / aTeamName : noms affichés (domicile / extérieur)
 */

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Rendu markdown minimal et sûr (contenu produit par notre propre agent). */
function toHtml(text) {
  if (!text) return '';
  return escapeHtml(text)
    .split('\n')
    .map((line) => {
      const bold = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      if (/^#{1,3}\s+/.test(line)) {
        return '<h5 class="mt-2" style="font-weight:700">' + bold.replace(/^#{1,3}\s+/, '') + '</h5>';
      }
      if (line.trim() === '') return '<div style="height:6px"></div>';
      return '<div>' + bold + '</div>';
    })
    .join('');
}

function MetaBadges({ data }) {
  if (!data) return null;
  const g = data.grounding;
  return (
    <div className="d-flex flex-wrap" style={{ gap: '6px', marginTop: '10px', alignItems: 'center', fontSize: '0.74rem' }}>
      {data.model && (
        <span style={{ background: '#ece3f5', color: '#5b2f91', borderRadius: '999px', padding: '3px 9px', fontWeight: 600 }}>
          {data.model.label}
        </span>
      )}
      {g && g.ok && (
        <span style={{ background: '#e6f5ea', color: '#1f7a3d', borderRadius: '999px', padding: '3px 9px', fontWeight: 600 }}>
          ✓ {g.grounded} chiffre(s) sourcé(s){g.derived ? ' + ' + g.derived + ' dérivé(s)' : ''}
        </span>
      )}
      {g && !g.ok && (
        <span style={{ background: '#fdf1dc', color: '#9a6a12', borderRadius: '999px', padding: '3px 9px', fontWeight: 600 }}>
          ⚠ {(g.ungrounded || []).length} chiffre(s) non sourcé(s)
        </span>
      )}
      {typeof data.costUsd === 'number' && (
        <span style={{ background: '#e9eef5', color: '#2a4d7a', borderRadius: '999px', padding: '3px 9px', fontWeight: 600 }}>
          ${data.costUsd.toFixed(data.costUsd < 0.01 ? 5 : 4)}
        </span>
      )}
    </div>
  );
}

const cardStyle = {
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '0.6rem',
  padding: '14px 16px',
  marginTop: '12px',
  lineHeight: 1.55,
};

export default function MatchAssistant({ teams, hTeamName, aTeamName }) {
  const homeId = teams && teams[0];
  const awayId = teams && teams[1];
  const ready = homeId && awayId && homeId !== 0 && awayId !== 0;

  const homeName = hTeamName || '';
  const awayName = aTeamName || '';

  // ── Debrief à la demande ───────────────────────────────────────────────────
  const [debrief, setDebrief] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [debriefError, setDebriefError] = useState('');

  const loadDebrief = useCallback(async () => {
    setDebriefLoading(true);
    setDebriefError('');
    try {
      const qs = new URLSearchParams({
        home_team_id: String(homeId),
        away_team_id: String(awayId),
        home_name: homeName,
        away_name: awayName,
      });
      const resp = await fetch('/api/nba/match-preview?' + qs.toString(), {
        headers: { Accept: 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        setDebriefError(data && data.message ? data.message : 'Debrief indisponible.');
      } else {
        setDebrief(data);
      }
    } catch (e) {
      setDebriefError('Debrief indisponible pour le moment.');
    } finally {
      setDebriefLoading(false);
    }
  }, [homeId, awayId, homeName, awayName]);

  // ── Chat scopé au match (sans mémoire) ─────────────────────────────────────
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const ask = useCallback(
    async (q) => {
      const question = (q !== undefined ? q : input).trim();
      if (question.length < 3 || sending) return;
      setSending(true);
      setInput('');
      // On suit le message par identité d'objet (pas par index) pour le mettre à jour.
      const pending = { question, loading: true };
      setMessages((prev) => [...prev, pending]);
      try {
        const resp = await fetch('/api/nba/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            match: {
              home_team_id: homeId,
              away_team_id: awayId,
              home_name: homeName,
              away_name: awayName,
            },
          }),
        });
        const data = await resp.json();
        const resolved = resp.ok
          ? { question, result: data }
          : { question, error: data && data.message ? data.message : 'Une erreur est survenue.' };
        setMessages((prev) => prev.map((m) => (m === pending ? resolved : m)));
      } catch (e) {
        const failed = { question, error: "Impossible de joindre l'assistant." };
        setMessages((prev) => prev.map((m) => (m === pending ? failed : m)));
      } finally {
        setSending(false);
      }
    },
    [input, sending, homeId, awayId, homeName, awayName]
  );

  if (!ready) return null;

  const examples = [
    'Qui est blessé dans les deux équipes ?',
    'Compare le net rating des deux équipes',
    'Quel est le meilleur scoreur de chaque équipe ?',
    'Qui a le meilleur bilan à domicile / à l’extérieur ?',
  ];

  return (
    <div className="col-lg-10 mx-auto text-white" style={{ marginBottom: '1.5rem' }}>
      {/* ── Debrief ── */}
      <div className="mt-4">
        <h3 className="text-center p-2">
          Debrief du match <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(généré par l'IA, chiffres sourcés)</span>
        </h3>

        {!debrief && !debriefLoading && (
          <div className="text-center">
            <button className="btn btn-light" style={{ fontWeight: 600 }} onClick={loadDebrief}>
              Générer le debrief du match
            </button>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Analyse générée à la demande — forme, net rating, confrontation directe, blessés.
            </div>
          </div>
        )}
        {debriefLoading && (
          <div className="text-center" style={{ fontStyle: 'italic', opacity: 0.85 }}>
            L'IA prépare le debrief du match…
          </div>
        )}
        {debriefError && (
          <div className="text-center" style={{ color: '#ffb3b3' }}>
            {debriefError}
          </div>
        )}
        {debrief && (
          <div style={cardStyle}>
            <div dangerouslySetInnerHTML={{ __html: toHtml(debrief.briefing) }} />
            <MetaBadges data={debrief} />
          </div>
        )}
      </div>

      {/* ── Chat scopé au match ── */}
      <div className="mt-4">
        <h3 className="text-center p-2">Pose ta question sur ce match</h3>
        <div style={{ fontSize: '0.85rem', opacity: 0.75, textAlign: 'center', marginBottom: '0.7rem' }}>
          Chaque question est analysée dans le contexte de {awayName} @ {homeName} — ces deux équipes et leurs joueurs.
        </div>

        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, opacity: 0.9, marginBottom: '2px' }}>❓ {m.question}</div>
            {m.loading && (
              <div style={{ fontStyle: 'italic', opacity: 0.8 }}>L'agent interroge les données NBA…</div>
            )}
            {m.error && <div style={{ color: '#ffb3b3' }}>{m.error}</div>}
            {m.result && (
              <div style={cardStyle}>
                <div dangerouslySetInnerHTML={{ __html: toHtml(m.result.answer) }} />
                <MetaBadges data={m.result} />
              </div>
            )}
          </div>
        ))}

        <form
          className="d-flex"
          style={{ gap: '8px', marginTop: '8px' }}
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input
            type="text"
            value={input}
            maxLength={500}
            disabled={sending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex. : qui est en forme en ce moment ?"
            style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #555', background: 'rgba(255,255,255,0.95)', color: '#1b1b1b' }}
          />
          <button
            type="submit"
            className="btn btn-light"
            style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            disabled={sending || input.trim().length < 3}
          >
            {sending ? 'Analyse…' : 'Demander'}
          </button>
        </form>

        <div className="d-flex flex-wrap justify-content-center" style={{ gap: '8px', marginTop: '10px' }}>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={sending}
              onClick={() => ask(ex)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                cursor: sending ? 'default' : 'pointer',
                opacity: sending ? 0.5 : 1,
              }}
            >
              {ex}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>
          Analyse pure fondée sur les données en direct — jamais un conseil de mise.
        </p>
      </div>
    </div>
  );
}
