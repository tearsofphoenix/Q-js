{
  'variables': {
      'libq_ext%': '',
  },
  'targets': [
    {
      'target_name': 'binding',
      'win_delay_load_hook': 'true',
      'sources': [
        'src/backends/simulators/cppkernels/addon.cpp'
      ],
      'cflags': [
        '-fexceptions',
        '-frtti',
      ],
      'cflags_cc': [
        '-fexceptions',
        '-frtti',
      ],
      'cflags!': [
        '-fno-exceptions',
        '-fno-rtti',
      ],
      'cflags_cc!': [
        '-fno-exceptions',
        '-fno-rtti',
      ],
      'msvs_settings': {
        'VCLinkerTool': {
           'SetChecksum': 'true'
        }
      },
      'xcode_settings': {
        'OTHER_CPLUSPLUSFLAGS': [
          '-std=c++11'
        ],
        'OTHER_LDFLAGS': [],
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'MACOSX_DEPLOYMENT_TARGET': '10.7'
      },
      'include_dirs': [
        '/opt/homebrew/include',
        '<!(node -e "require(\'nan\')")',
        'D:/cygwin64/boost_1_68_0',
      ],
      'conditions': [
        ['libq_ext == "" or libq_ext == "no"', {
          'dependencies': [
            './libq.gyp:libq',
          ]
        }],
        ['libq_ext == "auto"', {
          'cflags_cc': [
            '<!(pkg-config --cflags libq)',
          ],
          'link_settings': {
            'ldflags': [
              '<!(pkg-config --libs-only-other --libs-only-L libq)',
            ],
            'libraries': [
              '<!(pkg-config --libs-only-l libq)',
            ],
          }
        }],
        ['libq_ext == "yes"', {
          'cflags_cc': [
            '<(libq_cflags)',
          ],
          'link_settings': {
            'ldflags': [
              '<(libq_ldflags)',
            ],
            'libraries': [
              '<(libq_library)',
            ],
          }
        }],
        ['OS=="win" and MSVS_VERSION == "2015"', {
          'msvs_settings': {
            'VCCLCompilerTool': {
              'AdditionalOptions': [
                # disable Thread-Safe "Magic" for local static variables
                '/Zc:threadSafeInit-',
              ],
            },
          },
        }],
        ['OS!="win"', {
          'cflags_cc+': [
            '-std=c++0x'
          ]
        }]
      ]
    }
  ]
}
