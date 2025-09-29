import ast from 'abstract-syntax-tree';
import vm from 'vm';

// https://github.com/buxlabs/abstract-syntax-tree

function _prefixNames(src) {
  let tree: any = ast.parse(src).body[0];
  if (tree.type === 'ExpressionStatement') {
    tree = tree.expression;
  }
  ast.walk(tree, (node) => {
    if (node.type === 'Identifier') {
      ast.replace(tree, (n) => {
        if (n === node) {
          n['name'] = "." + n['name'];
        }
        return n;
      })
    }
  });
  return tree;
}

function edit() {
  const str = `if (kwargs) {
    q = '?';
    params = self._encodeQueryVars(kwargs);
  }
  else {
    q = params = '';
  }`;
  const tree = _prefixNames("code=1");//_prefixNames(str);
  const obj = ast.generate(tree);
  console.log(obj)
}

function _parse() {
  let expr: any = "{'invisible': [['apiKeyIds', '=', []]], 'readonly': ['label', true]}"
  if (typeof (expr) === 'string') {
    try {
      expr = 'const __astParse__ = ' + expr.trim();
      expr = ast.parse(expr).body[0];
      expr = expr['declarations'][0];
      expr = expr['init'];
    } catch (e) {
      throw new Error(`Invalid expression ${expr}`);
    }
  }
  const obj = ast.generate(expr);
  console.debug(obj) // { type: 'Program', body: [ ... ], loc: {...} }  
}

function _generate() {
  const source = 'const answer = 42'
  const tree = ast.parse(source)
  console.log(ast.generate(tree)) // 'const answer = 42;'
}

function _walk() {
  const source = 'const answer = 42'
  const tree = ast.parse(source);
  ast.walk(tree, (node, parent) => {
    console.log(node)
    console.log(parent)
  })
}

function _find() {
  const { parse, find } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  console.log(find(tree, 'VariableDeclaration')) // [ { type: 'VariableDeclaration', ... } ]
  console.log(find(tree, { type: 'VariableDeclaration' })) // [ { type: 'VariableDeclaration', ... } ]
}

function _serialize() {
  const { serialize } = require('abstract-syntax-tree')
  const node = {
    type: 'ArrayExpression',
    elements: [
      { type: 'Literal', value: 1 },
      { type: 'Literal', value: 2 },
      { type: 'Literal', value: 3 },
      { type: 'Literal', value: 4 },
      { type: 'Literal', value: 5 }
    ]
  }
  const array = serialize(node) // [1, 2, 3, 4, 5]
}

function _traverse() {
  const { parse, traverse } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  traverse(tree, {
    enter(node) { },
    leave(node) { }
  })
}

function _replace() {
  const { parse, replace } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  replace(tree, node => {
    if (node.type === 'VariableDeclaration') {
      node.kind = 'let'
    }
    return node
  })
}

function _remove() {
  const { parse, remove, generate } = require('abstract-syntax-tree')
  const source = '"use strict"; const b = 4;'
  const tree = parse(source)
  remove(tree, 'Literal[value="use strict"]')

  // or
  // remove(tree, { type: 'Literal', value: 'use strict' })

  // or
  // remove(tree, (node) => {
  //   if (node.type === 'Literal' && node.value === 'use strict') return null
  //   return node
  // })

  console.log(generate(tree)) // 'const b = 4;'
}

function _each() {
  const { parse, each } = require('abstract-syntax-tree')
  const source = 'const foo = 1; const bar = 2;'
  const tree = parse(source)
  console.log(tree)
  each(tree, 'VariableDeclaration', node => {
    console.log(node)
  })
}

function _first() {
  const { parse, first } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  console.log(first(tree, 'VariableDeclaration')) // { type: 'VariableDeclaration', ... }
}

function _last() {
  const { parse, last } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  console.log(last(tree, 'VariableDeclaration')) // { type: 'VariableDeclaration', ... }
}

function _reduce() {
  const { parse, reduce } = require('abstract-syntax-tree')
  const source = 'const a = 1, b = 2'
  const tree = parse(source)
  const value = reduce(tree, (sum, node) => {
    if (node.type === 'Literal') {
      sum += node.value
    }
    return sum
  }, 0)
  console.log(value) // 3
}

function _has() {
  const { parse, has } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  console.log(has(tree, 'VariableDeclaration')) // true
  console.log(has(tree, { type: 'VariableDeclaration' })) // true
}

function _count() {
  const { parse, count } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source)
  console.log(count(tree, 'VariableDeclaration')) // 1
  console.log(count(tree, { type: 'VariableDeclaration' })) // 1
}

function _append() {
  const { parse, append, generate } = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = parse(source) // => js object
  append(tree, {
    type: 'ExpressionStatement',
    expression: {
      type: "CallExpression",
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'console'
        },
        property: {
          type: 'Identifier',
          name: 'log'
        },
        computed: false
      },
      arguments: [
        {
          type: 'Identifier',
          name: 'answer'
        }
      ]
    }
  })
  append(tree, {
    "type": "Program",
    "loc": {
      "start": {
        "line": 1,
        "column": 0
      },
      "end": {
        "line": 6,
        "column": 17
      }
    },
    "range": [
      0,
      99
    ],
    "body": [
      {
        "type": "BlockStatement",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 1
          }
        },
        "range": [
          0,
          83
        ],
        "body": [
          {
            "type": "FunctionDeclaration",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 6,
                "column": 1
              }
            },
            "range": [
              0,
              83
            ],
            "id": {
              "type": "Identifier",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 6
                },
                "end": {
                  "line": 1,
                  "column": 7
                }
              },
              "range": [
                6,
                7
              ],
              "name": "O"
            },
            "params": [
              {
                "type": "Identifier",
                "loc": {
                  "start": {
                    "line": 2,
                    "column": 21
                  },
                  "end": {
                    "line": 2,
                    "column": 22
                  }
                },
                "range": [
                  30,
                  31
                ],
                "name": "s"
              }
            ],
            "body": {
              "type": "BlockStatement",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 8
                },
                "end": {
                  "line": 6,
                  "column": 1
                }
              },
              "range": [
                8,
                83
              ],
              "body": [
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__hasParams0"
                      },
                      "init": {
                        "type": "LogicalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "operator": "&&",
                        "left": {
                          "type": "LogicalExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "operator": "&&",
                          "left": {
                            "type": "BinaryExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "operator": ">",
                            "left": {
                              "type": "MemberExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "computed": false,
                              "object": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "name": "arguments"
                              },
                              "property": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "name": "length"
                              }
                            },
                            "right": {
                              "type": "Literal",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "value": 0
                            }
                          },
                          "right": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          }
                        },
                        "right": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "keywords"
                          }
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__params0"
                      },
                      "init": {
                        "type": "ConditionalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "test": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "name": "__hasParams0"
                        },
                        "consequent": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "keywords"
                          }
                        },
                        "alternate": {
                          "type": "ObjectExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "properties": []
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__realArgCount0"
                      },
                      "init": {
                        "type": "BinaryExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "operator": "-",
                        "left": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "arguments"
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "length"
                          }
                        },
                        "right": {
                          "type": "ConditionalExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "test": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__hasParams0"
                          },
                          "consequent": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": 1
                          },
                          "alternate": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": 0
                          }
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "IfStatement",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "test": {
                    "type": "BinaryExpression",
                    "loc": {
                      "start": {
                        "line": 2,
                        "column": 6
                      },
                      "end": {
                        "line": 2,
                        "column": 14
                      }
                    },
                    "range": [
                      15,
                      23
                    ],
                    "operator": "<",
                    "left": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "name": "__realArgCount0"
                    },
                    "right": {
                      "type": "Literal",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "value": 1
                    }
                  },
                  "consequent": {
                    "type": "ExpressionStatement",
                    "loc": {
                      "start": {
                        "line": 2,
                        "column": 6
                      },
                      "end": {
                        "line": 2,
                        "column": 14
                      }
                    },
                    "range": [
                      15,
                      23
                    ],
                    "expression": {
                      "type": "AssignmentExpression",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "operator": "=",
                      "left": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "s"
                      },
                      "right": {
                        "type": "ConditionalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "test": {
                          "type": "BinaryExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "operator": "in",
                          "left": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": "s"
                          },
                          "right": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__params0"
                          }
                        },
                        "consequent": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 2
                            },
                            "end": null
                          },
                          "range": [
                            11,
                            0
                          ],
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__params0"
                          },
                          "property": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": "s"
                          },
                          "computed": true
                        },
                        "alternate": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "name": "undefined"
                        }
                      }
                    }
                  }
                },
                {
                  "type": "ExpressionStatement",
                  "loc": {
                    "start": {
                      "line": 3,
                      "column": 6
                    },
                    "end": {
                      "line": 3,
                      "column": 17
                    }
                  },
                  "range": [
                    40,
                    51
                  ],
                  "expression": {
                    "type": "AssignmentExpression",
                    "loc": {
                      "start": {
                        "line": 3,
                        "column": 6
                      },
                      "end": {
                        "line": 3,
                        "column": 17
                      }
                    },
                    "range": [
                      40,
                      51
                    ],
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 6
                        },
                        "end": {
                          "line": 3,
                          "column": 15
                        }
                      },
                      "range": [
                        40,
                        49
                      ],
                      "object": {
                        "type": "ThisExpression",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 6
                          },
                          "end": {
                            "line": 3,
                            "column": 10
                          }
                        },
                        "range": [
                          40,
                          44
                        ]
                      },
                      "property": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 11
                          },
                          "end": {
                            "line": 3,
                            "column": 15
                          }
                        },
                        "range": [
                          45,
                          49
                        ],
                        "name": "code"
                      },
                      "computed": false
                    },
                    "right": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 16
                        },
                        "end": {
                          "line": 3,
                          "column": 17
                        }
                      },
                      "range": [
                        50,
                        51
                      ],
                      "name": "s"
                    }
                  }
                }
              ]
            }
          },
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 5,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 0
              }
            },
            "range": [
              61,
              82
            ],
            "expression": {
              "type": "AssignmentExpression",
              "loc": {
                "start": {
                  "line": 5,
                  "column": 2
                },
                "end": {
                  "line": 6,
                  "column": 0
                }
              },
              "range": [
                61,
                82
              ],
              "left": {
                "type": "MemberExpression",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 2
                  },
                  "end": {
                    "line": 6,
                    "column": 0
                  }
                },
                "range": [
                  61,
                  82
                ],
                "object": {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 2
                    },
                    "end": {
                      "line": 6,
                      "column": 0
                    }
                  },
                  "range": [
                    61,
                    82
                  ],
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 2
                      },
                      "end": {
                        "line": 6,
                        "column": 0
                      }
                    },
                    "range": [
                      61,
                      82
                    ],
                    "name": "O"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 2
                      },
                      "end": {
                        "line": 6,
                        "column": 0
                      }
                    },
                    "range": [
                      61,
                      82
                    ],
                    "name": "prototype"
                  },
                  "computed": false
                },
                "property": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 6
                    },
                    "end": {
                      "line": 5,
                      "column": 14
                    }
                  },
                  "range": [
                    65,
                    73
                  ],
                  "name": "toString"
                },
                "computed": false
              },
              "operator": "=",
              "right": {
                "type": "FunctionExpression",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 2
                  },
                  "end": {
                    "line": 6,
                    "column": 0
                  }
                },
                "range": [
                  61,
                  82
                ],
                "body": {
                  "type": "BlockStatement",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 22
                    },
                    "end": {
                      "line": 6,
                      "column": 0
                    }
                  },
                  "range": [
                    81,
                    82
                  ],
                  "body": []
                },
                "params": []
              }
            }
          }
        ]
      },
      {
        "type": "ReturnStatement",
        "loc": {
          "start": {
            "line": 6,
            "column": 1
          },
          "end": {
            "line": 6,
            "column": 17
          }
        },
        "range": [
          83,
          99
        ],
        "argument": {
          "type": "MemberExpression",
          "loc": {
            "start": {
              "line": 6,
              "column": 8
            },
            "end": {
              "line": 6,
              "column": 17
            }
          },
          "range": [
            90,
            99
          ],
          "object": {
            "type": "Identifier",
            "loc": {
              "start": {
                "line": 6,
                "column": 8
              },
              "end": {
                "line": 6,
                "column": 12
              }
            },
            "range": [
              90,
              94
            ],
            "name": "self"
          },
          "property": {
            "type": "Identifier",
            "loc": {
              "start": {
                "line": 6,
                "column": 13
              },
              "end": {
                "line": 6,
                "column": 17
              }
            },
            "range": [
              95,
              99
            ],
            "name": "code"
          },
          "computed": false
        }
      }
    ]
  })
  console.log(generate(tree))
}

function _append2() {
  const AbstractSyntaxTree = require('abstract-syntax-tree')
  const source = 'const answer = 42'
  const tree = new AbstractSyntaxTree(source) // => ast object
  AbstractSyntaxTree.append(tree, {
    "type": "Program",
    "loc": {
      "start": {
        "line": 1,
        "column": 0
      },
      "end": {
        "line": 6,
        "column": 17
      }
    },
    "range": [
      0,
      99
    ],
    "body": [
      {
        "type": "BlockStatement",
        "loc": {
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 6,
            "column": 1
          }
        },
        "range": [
          0,
          83
        ],
        "body": [
          {
            "type": "FunctionDeclaration",
            "loc": {
              "start": {
                "line": 1,
                "column": 0
              },
              "end": {
                "line": 6,
                "column": 1
              }
            },
            "range": [
              0,
              83
            ],
            "id": {
              "type": "Identifier",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 6
                },
                "end": {
                  "line": 1,
                  "column": 7
                }
              },
              "range": [
                6,
                7
              ],
              "name": "O"
            },
            "params": [
              {
                "type": "Identifier",
                "loc": {
                  "start": {
                    "line": 2,
                    "column": 21
                  },
                  "end": {
                    "line": 2,
                    "column": 22
                  }
                },
                "range": [
                  30,
                  31
                ],
                "name": "s"
              }
            ],
            "body": {
              "type": "BlockStatement",
              "loc": {
                "start": {
                  "line": 1,
                  "column": 8
                },
                "end": {
                  "line": 6,
                  "column": 1
                }
              },
              "range": [
                8,
                83
              ],
              "body": [
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__hasParams0"
                      },
                      "init": {
                        "type": "LogicalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "operator": "&&",
                        "left": {
                          "type": "LogicalExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "operator": "&&",
                          "left": {
                            "type": "BinaryExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "operator": ">",
                            "left": {
                              "type": "MemberExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "computed": false,
                              "object": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "name": "arguments"
                              },
                              "property": {
                                "type": "Identifier",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "name": "length"
                              }
                            },
                            "right": {
                              "type": "Literal",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "value": 0
                            }
                          },
                          "right": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          }
                        },
                        "right": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "keywords"
                          }
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__params0"
                      },
                      "init": {
                        "type": "ConditionalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "test": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "name": "__hasParams0"
                        },
                        "consequent": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "MemberExpression",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "computed": true,
                            "object": {
                              "type": "Identifier",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "name": "arguments"
                            },
                            "property": {
                              "type": "BinaryExpression",
                              "loc": {
                                "start": {
                                  "line": 2,
                                  "column": 6
                                },
                                "end": {
                                  "line": 2,
                                  "column": 14
                                }
                              },
                              "range": [
                                15,
                                23
                              ],
                              "operator": "-",
                              "left": {
                                "type": "MemberExpression",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "computed": false,
                                "object": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "arguments"
                                },
                                "property": {
                                  "type": "Identifier",
                                  "loc": {
                                    "start": {
                                      "line": 2,
                                      "column": 6
                                    },
                                    "end": {
                                      "line": 2,
                                      "column": 14
                                    }
                                  },
                                  "range": [
                                    15,
                                    23
                                  ],
                                  "name": "length"
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "loc": {
                                  "start": {
                                    "line": 2,
                                    "column": 6
                                  },
                                  "end": {
                                    "line": 2,
                                    "column": 14
                                  }
                                },
                                "range": [
                                  15,
                                  23
                                ],
                                "value": 1
                              }
                            }
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "keywords"
                          }
                        },
                        "alternate": {
                          "type": "ObjectExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "properties": []
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "VariableDeclaration",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "kind": "var",
                  "declarations": [
                    {
                      "type": "VariableDeclarator",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "id": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "__realArgCount0"
                      },
                      "init": {
                        "type": "BinaryExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "operator": "-",
                        "left": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "computed": false,
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "arguments"
                          },
                          "property": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "length"
                          }
                        },
                        "right": {
                          "type": "ConditionalExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "test": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__hasParams0"
                          },
                          "consequent": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": 1
                          },
                          "alternate": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": 0
                          }
                        }
                      }
                    }
                  ],
                  "userCode": false
                },
                {
                  "type": "IfStatement",
                  "loc": {
                    "start": {
                      "line": 2,
                      "column": 6
                    },
                    "end": {
                      "line": 2,
                      "column": 14
                    }
                  },
                  "range": [
                    15,
                    23
                  ],
                  "test": {
                    "type": "BinaryExpression",
                    "loc": {
                      "start": {
                        "line": 2,
                        "column": 6
                      },
                      "end": {
                        "line": 2,
                        "column": 14
                      }
                    },
                    "range": [
                      15,
                      23
                    ],
                    "operator": "<",
                    "left": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "name": "__realArgCount0"
                    },
                    "right": {
                      "type": "Literal",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "value": 1
                    }
                  },
                  "consequent": {
                    "type": "ExpressionStatement",
                    "loc": {
                      "start": {
                        "line": 2,
                        "column": 6
                      },
                      "end": {
                        "line": 2,
                        "column": 14
                      }
                    },
                    "range": [
                      15,
                      23
                    ],
                    "expression": {
                      "type": "AssignmentExpression",
                      "loc": {
                        "start": {
                          "line": 2,
                          "column": 6
                        },
                        "end": {
                          "line": 2,
                          "column": 14
                        }
                      },
                      "range": [
                        15,
                        23
                      ],
                      "operator": "=",
                      "left": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "name": "s"
                      },
                      "right": {
                        "type": "ConditionalExpression",
                        "loc": {
                          "start": {
                            "line": 2,
                            "column": 6
                          },
                          "end": {
                            "line": 2,
                            "column": 14
                          }
                        },
                        "range": [
                          15,
                          23
                        ],
                        "test": {
                          "type": "BinaryExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "operator": "in",
                          "left": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": "s"
                          },
                          "right": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__params0"
                          }
                        },
                        "consequent": {
                          "type": "MemberExpression",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 2
                            },
                            "end": null
                          },
                          "range": [
                            11,
                            0
                          ],
                          "object": {
                            "type": "Identifier",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "name": "__params0"
                          },
                          "property": {
                            "type": "Literal",
                            "loc": {
                              "start": {
                                "line": 2,
                                "column": 6
                              },
                              "end": {
                                "line": 2,
                                "column": 14
                              }
                            },
                            "range": [
                              15,
                              23
                            ],
                            "value": "s"
                          },
                          "computed": true
                        },
                        "alternate": {
                          "type": "Identifier",
                          "loc": {
                            "start": {
                              "line": 2,
                              "column": 6
                            },
                            "end": {
                              "line": 2,
                              "column": 14
                            }
                          },
                          "range": [
                            15,
                            23
                          ],
                          "name": "undefined"
                        }
                      }
                    }
                  }
                },
                {
                  "type": "ExpressionStatement",
                  "loc": {
                    "start": {
                      "line": 3,
                      "column": 6
                    },
                    "end": {
                      "line": 3,
                      "column": 17
                    }
                  },
                  "range": [
                    40,
                    51
                  ],
                  "expression": {
                    "type": "AssignmentExpression",
                    "loc": {
                      "start": {
                        "line": 3,
                        "column": 6
                      },
                      "end": {
                        "line": 3,
                        "column": 17
                      }
                    },
                    "range": [
                      40,
                      51
                    ],
                    "operator": "=",
                    "left": {
                      "type": "MemberExpression",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 6
                        },
                        "end": {
                          "line": 3,
                          "column": 15
                        }
                      },
                      "range": [
                        40,
                        49
                      ],
                      "object": {
                        "type": "ThisExpression",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 6
                          },
                          "end": {
                            "line": 3,
                            "column": 10
                          }
                        },
                        "range": [
                          40,
                          44
                        ]
                      },
                      "property": {
                        "type": "Identifier",
                        "loc": {
                          "start": {
                            "line": 3,
                            "column": 11
                          },
                          "end": {
                            "line": 3,
                            "column": 15
                          }
                        },
                        "range": [
                          45,
                          49
                        ],
                        "name": "code"
                      },
                      "computed": false
                    },
                    "right": {
                      "type": "Identifier",
                      "loc": {
                        "start": {
                          "line": 3,
                          "column": 16
                        },
                        "end": {
                          "line": 3,
                          "column": 17
                        }
                      },
                      "range": [
                        50,
                        51
                      ],
                      "name": "s"
                    }
                  }
                }
              ]
            }
          },
          {
            "type": "ExpressionStatement",
            "loc": {
              "start": {
                "line": 5,
                "column": 2
              },
              "end": {
                "line": 6,
                "column": 0
              }
            },
            "range": [
              61,
              82
            ],
            "expression": {
              "type": "AssignmentExpression",
              "loc": {
                "start": {
                  "line": 5,
                  "column": 2
                },
                "end": {
                  "line": 6,
                  "column": 0
                }
              },
              "range": [
                61,
                82
              ],
              "left": {
                "type": "MemberExpression",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 2
                  },
                  "end": {
                    "line": 6,
                    "column": 0
                  }
                },
                "range": [
                  61,
                  82
                ],
                "object": {
                  "type": "MemberExpression",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 2
                    },
                    "end": {
                      "line": 6,
                      "column": 0
                    }
                  },
                  "range": [
                    61,
                    82
                  ],
                  "object": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 2
                      },
                      "end": {
                        "line": 6,
                        "column": 0
                      }
                    },
                    "range": [
                      61,
                      82
                    ],
                    "name": "O"
                  },
                  "property": {
                    "type": "Identifier",
                    "loc": {
                      "start": {
                        "line": 5,
                        "column": 2
                      },
                      "end": {
                        "line": 6,
                        "column": 0
                      }
                    },
                    "range": [
                      61,
                      82
                    ],
                    "name": "prototype"
                  },
                  "computed": false
                },
                "property": {
                  "type": "Identifier",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 6
                    },
                    "end": {
                      "line": 5,
                      "column": 14
                    }
                  },
                  "range": [
                    65,
                    73
                  ],
                  "name": "toString"
                },
                "computed": false
              },
              "operator": "=",
              "right": {
                "type": "FunctionExpression",
                "loc": {
                  "start": {
                    "line": 5,
                    "column": 2
                  },
                  "end": {
                    "line": 6,
                    "column": 0
                  }
                },
                "range": [
                  61,
                  82
                ],
                "body": {
                  "type": "BlockStatement",
                  "loc": {
                    "start": {
                      "line": 5,
                      "column": 22
                    },
                    "end": {
                      "line": 6,
                      "column": 0
                    }
                  },
                  "range": [
                    81,
                    82
                  ],
                  "body": []
                },
                "params": []
              }
            }
          }
        ]
      },
      {
        "type": "ReturnStatement",
        "loc": {
          "start": {
            "line": 6,
            "column": 1
          },
          "end": {
            "line": 6,
            "column": 17
          }
        },
        "range": [
          83,
          99
        ],
        "argument": {
          "type": "MemberExpression",
          "loc": {
            "start": {
              "line": 6,
              "column": 8
            },
            "end": {
              "line": 6,
              "column": 17
            }
          },
          "range": [
            90,
            99
          ],
          "object": {
            "type": "Identifier",
            "loc": {
              "start": {
                "line": 6,
                "column": 8
              },
              "end": {
                "line": 6,
                "column": 12
              }
            },
            "range": [
              90,
              94
            ],
            "name": "self"
          },
          "property": {
            "type": "Identifier",
            "loc": {
              "start": {
                "line": 6,
                "column": 13
              },
              "end": {
                "line": 6,
                "column": 17
              }
            },
            "range": [
              95,
              99
            ],
            "name": "code"
          },
          "computed": false
        }
      }
    ]
  })
  console.log(tree.source); // # generate(tree)
}

function _prepend() {
  const { parse, prepend } = require('abstract-syntax-tree')
  const source = 'const a = 1;'
  const tree = parse(source)
  prepend(tree, {
    type: 'ExpressionStatement',
    expression: {
      type: 'Literal',
      value: 'use strict'
    }
  })
}

function _equal() {
  const { equal } = require('abstract-syntax-tree')
  console.log(equal({ type: 'Literal', value: 42 }, { type: 'Literal', value: 42 })) // true
  console.log(equal({ type: 'Literal', value: 41 }, { type: 'Literal', value: 42 })) // false
}

function _match() {
  const { match } = require('abstract-syntax-tree')
  console.log(match({ type: 'Literal', value: 42 }, 'Literal[value=42]')) // true
  console.log(match({ type: 'Literal', value: 41 }, 'Literal[value=42]')) // false
}

function _template() {
  const { template } = require('abstract-syntax-tree')
  const literal = template(42)
  const nodes = template('const foo = <%= bar %>;', { bar: { type: 'Literal', value: 1 } })

  const nodes2 = template('function foo(%= bar %) {}', {
    bar: [
      { type: 'Identifier', name: 'baz' },
      { type: 'Identifier', name: 'qux' }
    ]
  })
}

function _program() {
  const { program } = require('abstract-syntax-tree')
  const tree = program() // { type: 'Program', sourceType: 'module', body: [] }
}

function _iife() {
  const { iife } = require('abstract-syntax-tree')
  const node = iife() // { type: 'ExpressionStatement', expression: { ... } }
}

function _mark() {
  const AbstractSyntaxTree = require('abstract-syntax-tree')
  const tree = new AbstractSyntaxTree('const a = 1')
  tree.mark()
  console.log(tree.first('Program').cid) // 1
  console.log(tree.first('VariableDeclaration').cid) // 2
}

function _wrap() {
  const AbstractSyntaxTree = require('abstract-syntax-tree')
  const source = 'const a = 1'
  const tree = new AbstractSyntaxTree(source)
  tree.wrap(body => {
    return [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'FunctionExpression',
            params: [],
            body: {
              type: 'BlockStatement',
              body
            }
          },
          arguments: []
        }
      }
    ]
  })
}

function _unwrap() {
  const AbstractSyntaxTree = require('abstract-syntax-tree')
  const source = '(function () { console.log(1); }())'
  const tree = new AbstractSyntaxTree(source)
  tree.unwrap()
  console.log(tree.source) // console.log(1);
}

function _source() {
  const AbstractSyntaxTree = require('abstract-syntax-tree')
  const source = 'const foo = "bar";'
  const tree = new AbstractSyntaxTree(source)
  console.log(tree.source) // const foo = "bar";
}

function _toBinaryExpression() {
  const { toBinaryExpression } = require('abstract-syntax-tree')
  const expression = {
    type: 'ArrayExpression',
    elements: [
      { type: 'Literal', value: 'foo' },
      { type: 'Literal', value: 'bar' },
      { type: 'Literal', value: 'baz' }
    ]
  }
  console.log(toBinaryExpression(expression)) // { type: 'BinaryExpression', ... }
}

function _nodes() {
  const { ArrayExpression, Literal } = require('abstract-syntax-tree')
  const expression = new ArrayExpression([
    new Literal('foo'),
    new Literal('bar'),
    new Literal('baz')
  ])
}

export { };

const source = "(self) => { return [self] }";
const tree = {
  "type": "ExpressionStatement",
  "expression": {
    "type": "ArrowFunctionExpression",
    "params": [
      { "type": "Identifier", "name": "self" }
    ],
    "body": {
      "type": "BlockStatement",
      "body": [{
        "type": "ReturnStatement",
        "argument": {
          "type": "ArrayExpression",
          "elements": [
            { "type": "Identifier", "name": "self" }
          ]
        }
      }]
    },
    "async": false,
    "expression": false
  }
}


const tes = {
  type: "Program",
  sourceType: "module",
  body: [
    {
      type: "ExpressionStatement",
      expression: {
        type: "ArrowFunctionExpression",
        params: [
          {
            type: "Identifier",
            name: "self",
          },
          {
            type: "AssignmentPattern",
            left: {
              type: "Identifier",
              name: "kwargs",
            },
            right: {
              type: "Literal",
              properties: null,
            },
          },
        ],
        body: {
          type: "BlockStatement",
          body: [
          ],
        },
        async: false,
        expression: false,
      },
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: {
              type: "ArrayExpression",
              elements: [
                {
                  type: "Literal",
                  value: "",
                },
                {
                  type: "Literal",
                  value: "/base_setup/data",
                },
              ],
            },
          },
        ],
      },
    },
  ],
}


const source2 = `
  function foo (str = 'abc') { 
    let q, params;
    if (kwargs) {
      q = '?';
      params = self._encodeQueryVars(kwargs);
    }
    else {
      q = params = '';
    }
    return [str, 'bar', {id: 100}]; 
  }`;
const tree2 = { "type": "FunctionDeclaration", "id": { "type": "Identifier", "name": "foo" }, "params": [{ "type": "AssignmentPattern", "left": { "type": "Identifier", "name": "str" }, "right": { "type": "Literal", "value": "abc" } }], "body": { "type": "BlockStatement", "body": [{ "type": "VariableDeclaration", "kind": "let", "declarations": [{ "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "q" }, "init": null }, { "type": "VariableDeclarator", "id": { "type": "Identifier", "name": "params" }, "init": null }] }, { "type": "IfStatement", "test": { "type": "Identifier", "name": "kwargs" }, "consequent": { "type": "BlockStatement", "body": [{ "type": "ExpressionStatement", "expression": { "type": "AssignmentExpression", "left": { "type": "Identifier", "name": "q" }, "operator": "=", "right": { "type": "Literal", "value": "?" } } }, { "type": "ExpressionStatement", "expression": { "type": "AssignmentExpression", "left": { "type": "Identifier", "name": "params" }, "operator": "=", "right": { "type": "CallExpression", "callee": { "type": "MemberExpression", "object": { "type": "Identifier", "name": "self" }, "computed": false, "property": { "type": "Identifier", "name": "_encodeQueryVars" } }, "arguments": [{ "type": "Identifier", "name": "kwargs" }] } } }] }, "alternate": { "type": "BlockStatement", "body": [{ "type": "ExpressionStatement", "expression": { "type": "AssignmentExpression", "left": { "type": "Identifier", "name": "q" }, "operator": "=", "right": { "type": "AssignmentExpression", "left": { "type": "Identifier", "name": "params" }, "operator": "=", "right": { "type": "Literal", "value": "" } } } }] } }, { "type": "ReturnStatement", "argument": { "type": "ArrayExpression", "elements": [{ "type": "Identifier", "name": "str" }, { "type": "Literal", "value": "bar" }, { "type": "ObjectExpression", "properties": [{ "type": "Property", "key": { "type": "Identifier", "name": "id" }, "value": { "type": "Literal", "value": 100 }, "kind": "init", "computed": false, "method": false, "shorthand": false }] }] } }] }, "async": false, "generator": false }

const source3 = "[1].join('')";
const body0 = {
  "type": "ExpressionStatement",
  "expression": {
    "type": "CallExpression",
    "callee": {
      "type": "MemberExpression",
      "object": {
        "type": "ArrayExpression",
        "elements": [{ "type": "Literal", "value": 1 }]
      },
      "computed": false,
      "property": {
        "type": "Identifier", "name": "join"
      }
    },
    "arguments": [{ "type": "Literal", "value": "" }]
  }
}

const source4 = "function func(self, arg=1, kw={a: 100}) {}";
const body4 = {
  "type": "FunctionDeclaration", "id": { "type": "Identifier", "name": "func" }, "params": [
    { "type": "Identifier", "name": "self" }, { "type": "AssignmentPattern", "left": { "type": "Identifier", "name": "arg" }, "right": { "type": "Literal", "value": 1 } }, { "type": "AssignmentPattern", "left": { "type": "Identifier", "name": "kw" }, "right": { "type": "ObjectExpression", "properties": [{ "type": "Property", "key": { "type": "Identifier", "name": "a" }, "value": { "type": "Literal", "value": 100 }, "kind": "init", "computed": false, "method": false, "shorthand": false }] } }
  ], "body": { "type": "BlockStatement", "body": [] }, "async": false, "generator": false
}

const modul = {
  type: "Program",
  sourceType: "module",
  body: [
    {
      type: "FunctionDeclaration",
      id: {
        type: "Identifier",
        name: "__builder__",
      },
      params: [
        {
          type: "Identifier",
          name: "$$self",
        },
      ],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: {
              type: "ArrayExpression",
              elements: [
                {
                  type: "Identifier",
                  name: '$$self'
                },
                {
                  type: "Literal",
                  value: "",
                },
                {
                  type: "Literal",
                  value: "/base_setup/data",
                },
              ],
            },
          },
        ],
      },
      async: false,
      generator: false,
    },
  ],
}

// const tree2 = ast.parse(source2);
console.log(JSON.stringify(tree2.body[0]));
const code = ast.generate(tree2);
console.log(code);
const script = new Function(code);
console.log(script);
const self = 100;
const result = script.call(self);
console.log(result);

const func = (self, values, defaults) => {
    let q, params;
    values = Object.assign({}, values);
    for (const k of Object.keys(values)) {
      if ((k in defaults)) {
        values[k] = values[k] ?? defaults[k];
      }
    }
    if (values.params) {
      q = "?";
      params = self._encodeQueryVars(values.params);
    } else {
      q = "";
      params = "";
    }

    return ["", ["/", q, params].join("")];
  }