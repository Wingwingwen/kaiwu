CREATE TABLE `favorite_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sage` enum('confucius','laozi','buddha','plato') NOT NULL,
	`content` text NOT NULL,
	`originalContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_insights_id` PRIMARY KEY(`id`)
);
