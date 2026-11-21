<?php

namespace App\Nba;

/**
 * Source unique de vérité pour la saison NBA en cours.
 *
 * Les APIs stats.nba.com attendent le format "AAAA-AA" (ex. "2026-27").
 * Mettre à jour cette constante à chaque intersaison. Centraliser ici évite
 * les valeurs codées en dur et désynchronisées dans les différents services.
 */
final class Season
{
    public const CURRENT = '2026-27';
}
