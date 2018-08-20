{
  'targets': [
  {
    'target_name': 'libq',
    'win_delay_load_hook': 'false',
    'type': 'static_library',
    'defines': [
      'LIBQ_VERSION="<!(node -e "process.stdout.write(require(\'./package.json\').libq)")"'
    ],
    'defines!': [
      'DEBUG'
    ],
    'sources': [
      'src/backends/simulators/cppkernels/Wrapper.cpp',
      'src/backends/simulators/cppkernels/2dmapper.cpp'
    ],
    'cflags': [
      '-fexceptions',
      '-frtti',
    ],
    'cflags_cc': [
      '-fexceptions',
      '-frtti',
    ],
    'include_dirs': [ 'backends/simulators/cppkernels', 'node_modules/nan' ],
    'direct_dependent_settings': {
      'include_dirs': [ 'backends/simulators/cppkernels' ],
    },
    'conditions': [
      ['OS=="mac"', {
        'xcode_settings': {
          'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
          'CLANG_CXX_LIBRARY': 'libc++',
          'OTHER_LDFLAGS': [],
          'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
          'GCC_ENABLE_CPP_RTTI': 'YES',
          'MACOSX_DEPLOYMENT_TARGET': '10.7'
        }
      }],
      ['OS=="linux"', {
        'cflags!': [
          '-fno-exceptions',
          '-fno-rtti'
        ],
        'cflags_cc!': [
          '-fno-exceptions',
          '-fno-rtti'
        ]
      }],
      ['OS=="win"', {
        'include_dirs': ['D:/cygwin64/boost_1_68_0'],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'AdditionalOptions': [
              '/GR',
              '/EHsc'
            ]
          }
        }
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
