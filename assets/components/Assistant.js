import React, { useState, useEffect, useCallback } from 'react';

/**
 * Web surface for the AI layer.
 *
 *  - "Pose ta question NBA"  : natural-language Q&A (usage A), grounded answers
 *                             with the model used, routing reason and cost.
 *  - "Avant-matchs du soir"  : auto-generated grounded briefings (usage B).
 *
 * Both talk only to the Symfony proxy (props.askUrl / props.previewsUrl), which
 * forwards to the local Node agent. The Anthropic key never reaches the browser.
 * Tone stays analytical — the agent reports what the numbers say, never a tip.
 */

const EXAMPLES = [
    'Comment tirent les Warriors à trois-points cette saison ?',
    'Compare le net rating des Celtics et des Cavaliers',
    'Qui joue ce soir ?',
    'Quel est le bilan des Thunder à domicile ?',
];

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Minimal, safe markdown-ish rendering for agent output (own content). */
function toHtml(text) {
    if (!text) return '';
    const lines = escapeHtml(text).split('\n');
    const out = lines.map((line) => {
        const bold = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        if (/^#{1,2}\s+/.test(line)) {
            return '<h4 class="bk-brief-title">' + bold.replace(/^#{1,2}\s+/, '') + '</h4>';
        }
        if (line.trim() === '') return '<div class="bk-gap"></div>';
        return '<div>' + bold + '</div>';
    });
    return out.join('');
}

function Badge({ children, kind }) {
    return <span className={'bk-badge bk-badge-' + (kind || 'neutral')}>{children}</span>;
}

function GroundingBadge({ grounding }) {
    if (!grounding) return null;
    if (grounding.ok) {
        const derived = grounding.derived ? ' + ' + grounding.derived + ' dérivé(s)' : '';
        return (
            <Badge kind="ok" title="Chaque chiffre provient d'un résultat d'outil">
                ✓ {grounding.grounded} chiffre(s) sourcé(s){derived}
            </Badge>
        );
    }
    return (
        <Badge kind="warn" title={'Non sourcé : ' + (grounding.ungrounded || []).join(', ')}>
            ⚠ {(grounding.ungrounded || []).length} chiffre(s) non sourcé(s)
        </Badge>
    );
}

function AskSection({ askUrl }) {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const submit = useCallback(
        async (q) => {
            const asked = (q !== undefined ? q : question).trim();
            if (asked.length < 3 || loading) return;
            setLoading(true);
            setError('');
            setResult(null);
            try {
                const resp = await fetch(askUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: asked }),
                });
                const data = await resp.json();
                if (!resp.ok) {
                    setError(data && data.message ? data.message : 'Une erreur est survenue.');
                } else {
                    setResult(data);
                }
            } catch (e) {
                setError('Impossible de joindre l\'assistant. Réessaie dans un instant.');
            } finally {
                setLoading(false);
            }
        },
        [askUrl, question, loading]
    );

    return (
        <section className="bk-card">
            <h2 className="bk-section-title">Pose ta question NBA</h2>
            <p className="bk-section-sub">
                Un agent qui interroge les données en direct et ne cite que des chiffres tracés jusqu'à leur source.
            </p>

            <form
                className="bk-ask-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
            >
                <input
                    type="text"
                    className="bk-ask-input"
                    placeholder="Ex. : comment tirent les Warriors à trois-points cette saison ?"
                    value={question}
                    maxLength={500}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className="bk-ask-btn" disabled={loading || question.trim().length < 3}>
                    {loading ? 'Analyse…' : 'Demander'}
                </button>
            </form>

            <div className="bk-examples">
                {EXAMPLES.map((ex) => (
                    <button
                        key={ex}
                        type="button"
                        className="bk-chip"
                        disabled={loading}
                        onClick={() => {
                            setQuestion(ex);
                            submit(ex);
                        }}
                    >
                        {ex}
                    </button>
                ))}
            </div>

            {loading && <div className="bk-loading">L'agent interroge les données NBA…</div>}
            {error && <div className="bk-error">{error}</div>}

            {result && (
                <div className="bk-answer">
                    <div className="bk-brief" dangerouslySetInnerHTML={{ __html: toHtml(result.answer) }} />
                    <div className="bk-meta">
                        {result.model && <Badge kind="model">{result.model.label}</Badge>}
                        {result.reasons && result.reasons.length > 0 && (
                            <Badge kind="neutral" title="Pourquoi ce modèle">
                                {result.reasons.join(', ')}
                            </Badge>
                        )}
                        <GroundingBadge grounding={result.grounding} />
                        {typeof result.costUsd === 'number' && (
                            <Badge kind="cost" title="Coût estimé de cette réponse">
                                ${result.costUsd.toFixed(result.costUsd < 0.01 ? 5 : 4)}
                            </Badge>
                        )}
                        {typeof result.latencyMs === 'number' && (
                            <Badge kind="neutral">{(result.latencyMs / 1000).toFixed(1)}s</Badge>
                        )}
                    </div>
                    {result.tools && result.tools.length > 0 && (
                        <div className="bk-tools">
                            outils : {result.tools.map((t) => (t.isError ? t.name + '✗' : t.name)).join(' → ')}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function PreviewCard({ preview }) {
    return (
        <div className="bk-preview">
            <div className="bk-brief" dangerouslySetInnerHTML={{ __html: toHtml(preview.briefing) }} />
            <div className="bk-meta">
                <GroundingBadge grounding={preview.grounding} />
                {typeof preview.costUsd === 'number' && (
                    <Badge kind="cost">${preview.costUsd.toFixed(preview.costUsd < 0.01 ? 5 : 4)}</Badge>
                )}
            </div>
        </div>
    );
}

function PreviewsSection({ previewsUrl }) {
    const [loading, setLoading] = useState(true);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const [empty, setEmpty] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const resp = await fetch(previewsUrl, { headers: { Accept: 'application/json' } });
                const data = await resp.json();
                if (!alive) return;
                if (!resp.ok) {
                    setError(data && data.message ? data.message : 'Avant-matchs indisponibles.');
                } else if (!data.previews || data.previews.length === 0) {
                    setEmpty(true);
                } else {
                    setPreviews(data.previews);
                }
            } catch (e) {
                if (alive) setError('Avant-matchs indisponibles pour le moment.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [previewsUrl]);

    return (
        <section className="bk-card">
            <h2 className="bk-section-title">Avant-matchs du soir</h2>
            <p className="bk-section-sub">
                Briefings générés automatiquement, chaque chiffre sourcé. Analyse pure — jamais un conseil de mise.
            </p>
            {loading && <div className="bk-loading">Génération des avant-matchs…</div>}
            {error && <div className="bk-error">{error}</div>}
            {empty && !loading && <div className="bk-empty">Pas de match au programme.</div>}
            {previews.map((p) => (
                <PreviewCard key={p.gameId || p.title} preview={p} />
            ))}
        </section>
    );
}

export default function Assistant({ askUrl, previewsUrl }) {
    return (
        <div className="bk-assistant">
            <header className="bk-header">
                <a className="bk-back" href="/">← balldontlie</a>
                <h1 className="bk-title">Assistant NBA</h1>
                <p className="bk-tagline">
                    Agent d'analyse fondé sur les données en direct. Les chiffres proviennent des outils, pas de la mémoire du modèle.
                </p>
            </header>
            <AskSection askUrl={askUrl} />
            <PreviewsSection previewsUrl={previewsUrl} />
            <footer className="bk-footer">
                Démonstration technique : agent + serveur MCP + routing de modèle + contrôle de factualité.
            </footer>
        </div>
    );
}
