<?php

namespace App\Entity;

use App\Repository\BetRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BetRepository::class)]
class Bet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $username = null;

    #[ORM\Column]
    private ?float $odd = null;

    #[ORM\Column]
    private ?int $HomeOrAway = null;

    #[ORM\Column(length: 255)]
    private ?string $game = null;

    #[ORM\Column]
    private ?int $gameId = null;

    #[ORM\Column(length: 255)]
    private ?string $status = null;

    #[ORM\Column(length: 255)]
    private ?string $amount = null;

    #[ORM\Column(length: 255)]
    private ?string $startTime = null;

    #[ORM\Column(length: 255)]
    private ?string $startDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $betType = null;

    #[ORM\Column(nullable: true)]
    private ?float $betTypeValue = null;

    #[ORM\Column(nullable: true)]
    private ?int $playerId = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getOdd(): ?float
    {
        return $this->odd;
    }

    public function setOdd(float $odd): static
    {
        $this->odd = $odd;

        return $this;
    }

    public function getHomeOrAway(): ?int
    {
        return $this->HomeOrAway;
    }

    public function setHomeOrAway(int $HomeOrAway): static
    {
        $this->HomeOrAway = $HomeOrAway;

        return $this;
    }

    public function getGame(): ?string
    {
        return $this->game;
    }

    public function setGame(string $game): static
    {
        $this->game = $game;

        return $this;
    }

    public function getGameId(): ?int
    {
        return $this->gameId;
    }

    public function setGameId(int $gameId): static
    {
        $this->gameId = $gameId;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getAmount(): ?string
    {
        return $this->amount;
    }

    public function setAmount(string $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getStartTime(): ?string
    {
        return $this->startTime;
    }

    public function setStartTime(string $startTime): static
    {
        $this->startTime = $startTime;

        return $this;
    }

    public function getStartDate(): ?string
    {
        return $this->startDate;
    }

    public function setStartDate(string $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getBetType(): ?string
    {
        return $this->betType;
    }

    public function setBetType(?string $betType): static
    {
        $this->betType = $betType;

        return $this;
    }

    public function getBetTypeValue(): ?float
    {
        return $this->betTypeValue;
    }

    public function setBetTypeValue(?float $betTypeValue): static
    {
        $this->betTypeValue = $betTypeValue;

        return $this;
    }

    public function getPlayerId(): ?int
    {
        return $this->playerId;
    }

    public function setPlayerId(?int $playerId): static
    {
        $this->playerId = $playerId;

        return $this;
    }
}
