<?php

namespace App\Command;

use App\Entity\Bet;
use App\Entity\User;
use App\Services\BetManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Résout les paris en attente / acceptés à partir des résultats NBA.
 *
 * Remplace l'appel HTTP public à la route /check : à planifier via cron, par ex.
 *   php bin/console app:bets:check
 */
#[AsCommand(
    name: 'app:bets:check',
    description: 'Résout les paris en attente/acceptés depuis les résultats NBA.'
)]
class CheckBetsCommand extends Command
{
    private BetManager $betManager;
    private EntityManagerInterface $entityManager;

    public function __construct(BetManager $betManager, EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->betManager = $betManager;
        $this->entityManager = $entityManager;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $this->betManager->checkGames(
            $this->entityManager->getRepository(Bet::class),
            $this->entityManager->getRepository(User::class),
            $this->entityManager
        );

        $io->success('Paris vérifiés.');

        return Command::SUCCESS;
    }
}
