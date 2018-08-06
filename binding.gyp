{
  'variables': {
      'libsass_ext%': '',
  },
  'targets': [
    {
      'target_name': 'binding',
      'win_delay_load_hook': 'true',
      'sources': [
        'backends/simulators/cppsim.cpp'
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
        'GCC_ENABLE_CPP_EXCEPTIONS': 'NO',
        'MACOSX_DEPLOYMENT_TARGET': '10.7'
      },
      'include_dirs': [
        '<!(node -e "require(\'nan\')")',
      ],
      'conditions': [
        ['libsass_ext == "" or libsass_ext == "no"', {
          'dependencies': [
            './libq.gyp:libq',
          ]
        }],
        ['libsass_ext == "auto"', {
          'cflags_cc': [
            '<!(pkg-config --cflags libsass)',
          ],
          'link_settings': {
            'ldflags': [
              '<!(pkg-config --libs-only-other --libs-only-L libsass)',
            ],
            'libraries': [
              '<!(pkg-config --libs-only-l libsass)',
            ],
          }
        }],
        ['libsass_ext == "yes"', {
          'cflags_cc': [
            '<(libsass_cflags)',
          ],
          'link_settings': {
            'ldflags': [
              '<(libsass_ldflags)',
            ],
            'libraries': [
              '<(libsass_library)',
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
