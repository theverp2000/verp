*** Postgres ***
Executing (default): DROP DATABASE IF EXISTS `test_sequelize`;
Executing (default): CREATE DATABASE `test_sequelize`;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_actions` (`id`  SERIAL , PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_actwindow` (`id`  SERIAL , `ir_actions_id` INTEGER REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_report_xml` (`id`  SERIAL , `ir_actions_id` INTEGER REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_url` (`id`  SERIAL , `ir_actions_id` INTEGER REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_server` (`id`  SERIAL , `ir_actions_id` INTEGER REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_client` (`id`  SERIAL , `ir_actions_id` INTEGER REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `res_users` (`id`   SERIAL , `active` BOOLEAN DEFAULT true, `login` VARCHAR(64) NOT NULL UNIQUE, `password` VARCHAR(255) DEFAULT NULL, `companyId` INTEGER, `partnerId` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `res_groups` (`id`   SERIAL , `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_category` (`id`   SERIAL , `createdUid` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, `updatedAt` TIMESTAMP WITH TIME ZONE, `updatedUid` INTEGER, `parentId` INTEGER REFERENCES `ir_module_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_module` (`id` INTEGER NOT NULL , `createdUid` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, `updatedAt` TIMESTAMP WITH 
TIME ZONE, `updatedUid` INTEGER, `website` VARCHAR(255), `summary` VARCHAR(255), `name` VARCHAR(255) NOT NULL, `author` VARCHAR(255), `icon` VARCHAR(255), `state` VARCHAR(16), `latest_version` VARCHAR(255), `shortdesc` VARCHAR(255), `categoryId` INTEGER REFERENCES `ir_module_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, `description` TEXT, `application` BOOLEAN DEFAULT false, `demo` BOOLEAN DEFAULT false, `web` BOOLEAN DEFAULT false, `license` VARCHAR(32), `sequence` INTEGER, `auto_install` BOOLEAN DEFAULT false, `to_buy` BOOLEAN DEFAULT false, PRIMARY KEY (`id`));
Executing (default): ALTER TABLE `ir_module_module` ADD CONSTRAINT `name_uniq` UNIQUE (`name`);
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_module_dependency` (`id`   SERIAL , `createdUid` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, `updatedAt` TIMESTAMP WITH TIME ZONE, `updatedUid` INTEGER, `name` CHAR(255), `module_id` INTEGER REFERENCES `ir_module_module` (`id`) ON DELETE CASCADE, `auto_install_required` BOOLEAN DEFAULT true, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `ir_model_data` (`id`   SERIAL , `createdUid` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, `updatedAt` TIMESTAMP WITH TIME ZONE, 
`updatedUid` INTEGER, `noupdate` BOOLEAN DEFAULT false, `name` CHAR(255) NOT NULL, `module` CHAR(255) NOT NULL, `model` CHAR(255) NOT NULL, `resId` INTEGER, PRIMARY KEY (`id`));     
Executing (default): CREATE TABLE IF NOT EXISTS `res_currency` (`id`   SERIAL , `name` CHAR(255) NOT NULL, `symbol` CHAR(255) NOT NULL, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `res_company` (`id`   SERIAL , `name` CHAR(255) NOT NULL, `partnerId` INTEGER, `currencyId` INTEGER, `sequence` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, PRIMARY KEY (`id`));
Executing (default): CREATE TABLE IF NOT EXISTS `res_partner` (`id`   SERIAL , `name` VARCHAR(255) NOT NULL, `companyId` INTEGER, `createdAt` TIMESTAMP WITH TIME ZONE, PRIMARY KEY (`id`));
Executing (default): INSERT INTO `res_currency` (`id`,`name`,`symbol`) VALUES ($1,$2,$3);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES ($1,$2,$3,$4,$5);
Executing (default): INSERT INTO `res_company` (`id`,`name`,`partnerId`,`currencyId`,`createdAt`) VALUES ($1,$2,$3,$4,$5);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES ($1,$2,$3,$4,$5);
Executing (default): INSERT INTO `res_partner` (`id`,`name`,`companyId`,`createdAt`) VALUES ($1,$2,$3,$4);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES ($1,$2,$3,$4,$5);
Executing (default): INSERT INTO `res_users` (`id`,`login`,`password`,`active`,`partnerId`,`companyId`,`createdAt`) VALUES ($1,$2,$3,$4,$5,$6,$7);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES ($1,$2,$3,$4,$5);
Executing (default): INSERT INTO `res_groups` (`id`,`name`) VALUES ($1,$2);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES ($1,$2,$3,$4,$5);
*** Mariadb ***
Executing (default): DROP DATABASE IF EXISTS `test_sequelize`;
Executing (default): CREATE DATABASE IF NOT EXISTS `test_sequelize`;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_actions` (`id` INTEGER auto_increment , PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_actwindow` (`id` INTEGER auto_increment , `ir_actions_id` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`ir_actions_id`) REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_report_xml` (`id` INTEGER auto_increment , `ir_actions_id` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`ir_actions_id`) REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_url` (`id` INTEGER auto_increment , `ir_actions_id` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`ir_actions_id`) REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_server` (`id` INTEGER auto_increment , `ir_actions_id` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`ir_actions_id`) REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_act_client` (`id` INTEGER auto_increment , `ir_actions_id` INTEGER, PRIMARY KEY (`id`), FOREIGN KEY (`ir_actions_id`) REFERENCES `ir_actions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `res_users` (`id` INTEGER NOT NULL auto_increment , `active` TINYINT(1) DEFAULT true, `login` VARCHAR(64) NOT NULL UNIQUE, `password` 
VARCHAR(255) DEFAULT NULL, `companyId` INTEGER, `partnerId` INTEGER, `createdAt` DATETIME, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `res_groups` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_category` (`id` INTEGER NOT NULL auto_increment , `createdUid` INTEGER, `createdAt` DATETIME, `updatedAt` DATETIME, `updatedUid` INTEGER, `parentId` INTEGER, `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`parentId`) REFERENCES `ir_module_category` (`id`) ON DELETE SET NULL ON UPDATE 
CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_module` (`id` INTEGER NOT NULL , `createdUid` INTEGER, `createdAt` DATETIME, `updatedAt` DATETIME, `updatedUid` INTEGER, 
`website` VARCHAR(255), `summary` VARCHAR(255), `name` VARCHAR(255) NOT NULL, `author` VARCHAR(255), `icon` VARCHAR(255), `state` VARCHAR(16), `latest_version` VARCHAR(255), `shortdesc` VARCHAR(255), `categoryId` INTEGER, `description` TEXT, `application` TINYINT(1) DEFAULT false, `demo` TINYINT(1) DEFAULT false, `web` TINYINT(1) DEFAULT false, `license` VARCHAR(32), `sequence` INTEGER, `auto_install` TINYINT(1) DEFAULT false, `to_buy` TINYINT(1) DEFAULT false, PRIMARY KEY (`id`), FOREIGN KEY (`categoryId`) REFERENCES `ir_module_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE) ENGINE=InnoDB;
Executing (default): ALTER TABLE `ir_module_module` ADD CONSTRAINT `name_uniq` UNIQUE (`name`);
Executing (default): CREATE TABLE IF NOT EXISTS `ir_module_module_dependency` (`id` INTEGER NOT NULL auto_increment , `createdUid` INTEGER, `createdAt` DATETIME, `updatedAt` DATETIME, `updatedUid` INTEGER, `name` CHAR(255), `module_id` INTEGER, `auto_install_required` TINYINT(1) DEFAULT true, PRIMARY KEY (`id`), FOREIGN KEY (`module_id`) REFERENCES `ir_module_module` (`id`) ON DELETE CASCADE) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `ir_model_data` (`id` INTEGER NOT NULL auto_increment , `createdUid` INTEGER, `createdAt` DATETIME, `updatedAt` DATETIME, `updatedUid` INTEGER, `noupdate` TINYINT(1) DEFAULT false, `name` CHAR(255) NOT NULL, `module` CHAR(255) NOT NULL, `model` CHAR(255) NOT NULL, `resId` INTEGER, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `res_currency` (`id` INTEGER NOT NULL auto_increment , `name` CHAR(255) NOT NULL, `symbol` CHAR(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `res_company` (`id` INTEGER NOT NULL auto_increment , `name` CHAR(255) NOT NULL, `partnerId` INTEGER, `currencyId` INTEGER, `sequence` INTEGER, `createdAt` DATETIME, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): CREATE TABLE IF NOT EXISTS `res_partner` (`id` INTEGER NOT NULL auto_increment , `name` VARCHAR(255) NOT NULL, `companyId` INTEGER, `createdAt` DATETIME, PRIMARY KEY (`id`)) ENGINE=InnoDB;
Executing (default): INSERT INTO `res_currency` (`id`,`name`,`symbol`) VALUES (?,?,?);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES (?,?,?,?,?);
Executing (default): INSERT INTO `res_company` (`id`,`name`,`partnerId`,`currencyId`,`createdAt`) VALUES (?,?,?,?,?);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES (?,?,?,?,?);
Executing (default): INSERT INTO `res_partner` (`id`,`name`,`companyId`,`createdAt`) VALUES (?,?,?,?);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES (?,?,?,?,?);
Executing (default): INSERT INTO `res_users` (`id`,`login`,`password`,`active`,`partnerId`,`companyId`,`createdAt`) VALUES (?,?,?,?,?,?,?);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES (?,?,?,?,?);
Executing (default): INSERT INTO `res_groups` (`id`,`name`) VALUES (?,?);
Executing (default): INSERT INTO `ir_model_data` (`name`,`module`,`model`,`noupdate`,`resId`) VALUES (?,?,?,?,?);s