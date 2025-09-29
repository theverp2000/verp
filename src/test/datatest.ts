import { DataTypes } from "../core/service/sequelize";

module.exports = (dialect: string) => {
  const models = [
    {
      irModuleCategory: {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          // allowNull: false,
          primaryKey: true
        },
        createdUid: {
          type: DataTypes.INTEGER
        }, //-- references res_users on delete set null,
        createdAt: {
          type: DataTypes.DATE
        },
        updatedAt: {
          type: DataTypes.DATE
        },
        updatedUid: {
          type: DataTypes.INTEGER
        }, //-- references res_users on delete set null,
        parentId: {
          type: DataTypes.INTEGER,
          references: {model: 'irModuleCategory'}, // TODO
          ondelete: 'SET NULL',
          onupdate: 'CASCADE'
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        }
      },
      irModuleModule: {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: false,
          // allowNull: false,
          primaryKey: true
        },
        createdUid: {
          type: DataTypes.INTEGER,// -- references res_users on delete set null,
        },
        createdAt: {
          type: DataTypes.DATE
        },
        updatedAt: {
          type: DataTypes.DATE
        },
        updatedUid: {
          type: DataTypes.INTEGER,//-- references res_users on delete set null,
        },
        website: {
          type: DataTypes.STRING,
        },
        summary: {
          type: DataTypes.STRING,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        author: {
          type: DataTypes.STRING,
        },
        icon: {
          type: DataTypes.STRING,
        },
        state: {
          type: DataTypes.STRING(16),
        },
        latest_version: {
          type: DataTypes.STRING,
        },
        shortdesc: {
          type: DataTypes.STRING,
        },
        categoryId: {
          type: DataTypes.INTEGER,
          references: {model: 'irModuleCategory'}, // TODO
          ondelete: 'SET NULL',
          onupdate: 'CASCADE'
        },
        description: {
          type: DataTypes.TEXT,
        },
        application: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        demo: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        web: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        license: {
          type: DataTypes.STRING(32),
        },
        sequence: {
          type: DataTypes.INTEGER,
          defaultValue: 100
        },
        autoInstall: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        toBuy: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        }
      },
    },
    {
      '#command': 'addConstraint',
      irModuleModule: {
        type: 'unique',
        name: 'label_uniq',
        fields: ['label']
      }
    },
  ];

  const data = [
    
  ];

  return {
    models: models,
    data: data
  };
}