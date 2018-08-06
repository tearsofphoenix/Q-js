cmake_minimum_required(VERSION 3.10)

project(simulator)

set(CMAKE_CXX_STANDARD 11)

include_directories(/Users/isaac/workspace/Q-js/node_modules/nan/ /usr/local/include/node/)

add_library(simulator Wrapper.cpp)
