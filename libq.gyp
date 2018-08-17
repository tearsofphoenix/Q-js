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
      'backends/simulators/cppkernels/Wrapper.cpp'
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
      ['OS=="win"', {
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
