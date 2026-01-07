CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promptId` int,
	`content` text NOT NULL,
	`category` enum('gratitude','philosophical') NOT NULL,
	`isFreeWrite` boolean NOT NULL DEFAULT false,
	`sageInsights` text,
	`isDraft` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `writing_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`category` enum('gratitude','philosophical') NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `writing_prompts_id` PRIMARY KEY(`id`)
);
