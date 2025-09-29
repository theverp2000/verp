import { DataTypes } from "../core/service/sequelize";

module.exports = (dialect: string) => {
  const models = [
  {
    irActions: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
    },
    irActwindow: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      irActionsId: {
        type: DataTypes.INTEGER,
        references: {model: 'irActions'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
    },
    irActReportXml: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      irActionsId: {
        type: DataTypes.INTEGER,
        references: {model: 'irActions'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
    },
    irActionsUrl: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      irActionsId: {
        type: DataTypes.INTEGER,
        references: {model: 'irActions'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
    },
    irActionsServer: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      irActionsId: {
        type: DataTypes.INTEGER,
        references: {model: 'irActions'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
    },
    irActClient: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      irActionsId: {
        type: DataTypes.INTEGER,
        references: {model: 'irActions'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
    },
    resUsers: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      login: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      // -- No FK references below, will be added later by ORM
      // -- (when the destination rows exist)
      companyId: {
        type: DataTypes.INTEGER
      },
      partnerId: {
        type: DataTypes.INTEGER
      },
      createdAt: {
        type: DataTypes.DATE
      }
    },
    resGroups: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    irModuleCategory: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      createdUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      },
      updatedUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
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
        autoIncrement: true,
        primaryKey: true
      },
      createdUid: {
        type: DataTypes.INTEGER,// -- references resUsers on delete set null,
      },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      },
      updatedUid: {
        type: DataTypes.INTEGER,//-- references resUsers on delete set null,
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
      latestVersion: {
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
  // {
  //   '#command': 'addConstraint',
  //   irModuleModule: {
  //     type: 'unique',
  //     name: 'nameUniq',
  //     fields: ['name']
  //   }
  // },
  {
    irModuleModuleDependency: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      createdUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      },
      updatedUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
      name: {
        type: DataTypes.STRING
      },
      moduleId: {
        type: DataTypes.INTEGER,
        references: {model: 'irModuleModule'}, // TODO
        ondelete: 'CASCADE',
        onupdate: 'CASCADE'
      },
      autoInstallRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      }
    },
  },
  {
    irModelData: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      createdUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW //DEFAULT (now() at time zone 'UTC')
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW //DEFAULT (now() at time zone 'UTC')
      },
      updatedUid: {
        type: DataTypes.INTEGER
      }, //-- references resUsers on delete set null,
      noupdate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      module: {
        type: DataTypes.STRING,
        allowNull: false
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false
      },
      resId: {
        type: DataTypes.INTEGER
      }
    },
    resCurrency: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    resCompany: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      partnerId: {
        type: DataTypes.INTEGER
      },
      currencyId: {
        type: DataTypes.INTEGER
      },
      sequence: {
        type: DataTypes.INTEGER
      },
      createdAt: {
        type: DataTypes.DATE
      }
    },
    resPartner: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER
      },
      createdAt: {
        type: DataTypes.DATE
      }
    }
  },
  {
    '#command': 'addConstraint',
    irModuleModule: {
      type: 'unique',
      name: 'nameUniq',
      fields: ['name']
    }
  },
  ];
  const data = [
    { 
      'resCurrency': {
        'id': 1, 'name': 'EUR', 'symbol': '€'
      } 
    },
    [ 
      'irModelData', 
      ['name', 'module', 'model', 'noupdate', 'resId'], 
      ['EUR', 'base', 'res.currency', true, 1],
    ],
    [
      'resCompany', 
      ['id', 'name', 'partnerId', 'currencyId', 'createdAt'], 
      [1, 'My Company', 1, 1, now()]
    ],
    [
      'irModelData', 
      ['name', 'module', 'model', 'noupdate', 'resId'],  
      ['mainCompany', 'base', 'res.company', true, 1]
    ],
    [
      'resPartner', 
      ['id', 'name', 'companyId', 'createdAt'], 
      [1, 'My Company', 1, now()]
    ],
    [
      'irModelData', 
      ['name', 'module', 'model', 'noupdate', 'resId'],
      ['mainPartner', 'base', 'res.partner', true, 1]
    ],
    [
      'resUsers',
      ['id', 'login', 'password', 'active', 'partnerId', 'companyId', 'createdAt'],
      [1, '__system__', null, false, 1, 1, now()]
    ],
    [
      'irModelData',
      ['name', 'module', 'model', 'noupdate', 'resId'],
      ['userRoot', 'base', 'res.users', true, 1]
    ],
    [
      'resGroups',
      ['id', 'name'],
      [1, 'Employee']
    ],
    [
      'irModelData',
      ['name', 'module', 'model', 'noupdate', 'resId'],
      ['groupUser', 'base', 'res.groups', true, 1]
    ]
  ]

  return {
    models: models,
    data: data
  };

  function now() {
    return Date.now();
  }
};