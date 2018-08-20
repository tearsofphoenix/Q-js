//
// Created by Administrator on 2018/8/20.
//

#ifndef SIMULATOR_2DMAPPER_HPP
#define SIMULATOR_2DMAPPER_HPP

#include <nan.h>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/bipartite.hpp>
#include <boost/graph/max_cardinality_matching.hpp>
#include <boost/graph/graph_utility.hpp>

void twodMapperInit(v8::Local<v8::Object> exports);

#endif //SIMULATOR_2DMAPPER_HPP
