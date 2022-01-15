export type OtcIdl = {
  'version': '0.0.0',
  'name': 'convergence_hack',
  'instructions': [
    {
      'name': 'initializeDeal',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': true
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': true
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false
        },
        {
          'name': 'rent',
          'isMut': false,
          'isSigner': false
        }
      ],
      'args': [
        {
          'name': 'makerLamportsOffer',
          'type': 'u64'
        },
        {
          'name': 'makerLamportsRequest',
          'type': 'u64'
        },
        {
          'name': 'makerAmounts',
          'type': {
            'vec': 'u64'
          }
        },
        {
          'name': 'takerAmounts',
          'type': {
            'vec': 'u64'
          }
        },
        {
          'name': 'takerKey',
          'type': {
            'option': 'publicKey'
          }
        }
      ]
    },
    {
      'name': 'exchange',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': false
        },
        {
          'name': 'taker',
          'isMut': true,
          'isSigner': true
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': false
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false
        }
      ],
      'args': []
    },
    {
      'name': 'closeDeal',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': true
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': false
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false
        }
      ],
      'args': []
    }
  ],
  'accounts': [
    {
      'name': 'escrowAccount',
      'type': {
        'kind': 'struct',
        'fields': [
          {
            'name': 'maker',
            'type': 'publicKey'
          },
          {
            'name': 'taker',
            'type': {
              'option': 'publicKey'
            }
          },
          {
            'name': 'makerLamportsOffer',
            'type': 'u64'
          },
          {
            'name': 'makerLamportsRequest',
            'type': 'u64'
          },
          {
            'name': 'makerTokensRequest',
            'type': {
              'vec': {
                'defined': 'TokenInfo'
              }
            }
          },
          {
            'name': 'makerLockedTokens',
            'type': {
              'vec': {
                'defined': 'TokenInfo'
              }
            }
          }
        ]
      }
    }
  ],
  'types': [
    {
      'name': 'TokenInfo',
      'type': {
        'kind': 'struct',
        'fields': [
          {
            'name': 'pubkey',
            'type': 'publicKey'
          },
          {
            'name': 'amount',
            'type': 'u64'
          }
        ]
      }
    }
  ],
  'errors': [
    {
      'code': 300,
      'name': 'NotEnoughAccounts',
      'msg': 'Not enough accounts was provided'
    },
    {
      'code': 301,
      'name': 'BadTokenAccount',
      'msg': 'Bad token account'
    },
    {
      'code': 302,
      'name': 'NotEnoughMakerTokenAccountsTo',
      'msg': 'Not enough maker token destination accounts was provided'
    },
    {
      'code': 303,
      'name': 'NotEnoughMakerTokenAccountsFrom',
      'msg': 'Not enough maker token source accounts was provided'
    },
    {
      'code': 304,
      'name': 'BadMint',
      'msg': 'Bad mint account'
    },
    {
      'code': 305,
      'name': 'BadTaker',
      'msg': 'Bad taker account'
    },
    {
      'code': 306,
      'name': 'TokenAccountsNotMatched',
      'msg': 'Token accounts from different mint'
    }
  ]
}

export const IDL: OtcIdl = {
  'version': '0.0.0',
  'name': 'convergence_hack',
  'instructions': [
    {
      'name': 'initializeDeal',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': true,
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': true,
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false,
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false,
        },
        {
          'name': 'rent',
          'isMut': false,
          'isSigner': false,
        },
      ],
      'args': [
        {
          'name': 'makerLamportsOffer',
          'type': 'u64',
        },
        {
          'name': 'makerLamportsRequest',
          'type': 'u64',
        },
        {
          'name': 'makerAmounts',
          'type': {
            'vec': 'u64',
          },
        },
        {
          'name': 'takerAmounts',
          'type': {
            'vec': 'u64',
          },
        },
        {
          'name': 'takerKey',
          'type': {
            'option': 'publicKey',
          },
        },
      ],
    },
    {
      'name': 'exchange',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': false,
        },
        {
          'name': 'taker',
          'isMut': true,
          'isSigner': true,
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': false,
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false,
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false,
        },
      ],
      'args': [],
    },
    {
      'name': 'closeDeal',
      'accounts': [
        {
          'name': 'maker',
          'isMut': true,
          'isSigner': true,
        },
        {
          'name': 'escrow',
          'isMut': true,
          'isSigner': false,
        },
        {
          'name': 'systemProgram',
          'isMut': false,
          'isSigner': false,
        },
        {
          'name': 'tokenProgram',
          'isMut': false,
          'isSigner': false,
        },
      ],
      'args': [],
    },
  ],
  'accounts': [
    {
      'name': 'escrowAccount',
      'type': {
        'kind': 'struct',
        'fields': [
          {
            'name': 'maker',
            'type': 'publicKey',
          },
          {
            'name': 'taker',
            'type': {
              'option': 'publicKey',
            },
          },
          {
            'name': 'makerLamportsOffer',
            'type': 'u64',
          },
          {
            'name': 'makerLamportsRequest',
            'type': 'u64',
          },
          {
            'name': 'makerTokensRequest',
            'type': {
              'vec': {
                'defined': 'TokenInfo',
              },
            },
          },
          {
            'name': 'makerLockedTokens',
            'type': {
              'vec': {
                'defined': 'TokenInfo',
              },
            },
          },
        ],
      },
    },
  ],
  'types': [
    {
      'name': 'TokenInfo',
      'type': {
        'kind': 'struct',
        'fields': [
          {
            'name': 'pubkey',
            'type': 'publicKey',
          },
          {
            'name': 'amount',
            'type': 'u64',
          },
        ],
      },
    },
  ],
  'errors': [
    {
      'code': 300,
      'name': 'NotEnoughAccounts',
      'msg': 'Not enough accounts was provided',
    },
    {
      'code': 301,
      'name': 'BadTokenAccount',
      'msg': 'Bad token account',
    },
    {
      'code': 302,
      'name': 'NotEnoughMakerTokenAccountsTo',
      'msg': 'Not enough maker token destination accounts was provided',
    },
    {
      'code': 303,
      'name': 'NotEnoughMakerTokenAccountsFrom',
      'msg': 'Not enough maker token source accounts was provided',
    },
    {
      'code': 304,
      'name': 'BadMint',
      'msg': 'Bad mint account',
    },
    {
      'code': 305,
      'name': 'BadTaker',
      'msg': 'Bad taker account',
    },
    {
      'code': 306,
      'name': 'TokenAccountsNotMatched',
      'msg': 'Token accounts from different mint',
    },
  ],
}
