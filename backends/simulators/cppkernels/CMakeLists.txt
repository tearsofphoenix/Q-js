cmake_minimum_required(VERSION 3.10)

project(simulator)

set(CMAKE_CXX_STANDARD 11)

include_directories(/Users/isaac/workspace/Q-js/node_modules/nan/ /usr/local/include/node/ E:/workpace/Q/node_modules/nan
        C:/Users/Administrator.-20171106WFEKLN/.node-gyp/8.11.3/include/node)

add_library(simulator Wrapper.cpp simulator.hpp fusion.hpp addon.cpp Wrapper.hpp nointrin/kernel1.hpp nointrin/kernel2.hpp
        nointrin/kernel3.hpp nointrin/kernel4.hpp nointrin/kernel5.hpp intrin/kernel1.hpp intrin/kernel2.hpp
        intrin/kernel3.hpp intrin/kernel4.hpp intrin/kernel5.hpp intrin/kernels.hpp intrin/cintrin.hpp
        intrin/alignedallocator.hpp)
