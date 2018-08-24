
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/bipartite.hpp>
#include <boost/graph/max_cardinality_matching.hpp>

#include "2dmapper.hpp"

using namespace boost;
using namespace v8;

typedef boost::adjacency_list <boost::vecS, boost::vecS, boost::undirectedS> Graph;

typedef std::vector<int> PositionVector;
typedef std::vector<PositionVector> PositionGrid;
typedef std::vector<std::map<int, int>> Tracking;
typedef std::vector<graph_traits<adjacency_list<>>::vertex_descriptor> Match;

static void returnNewSwap(std::vector<Match> &matchings, int numRows, int numColumns, PositionGrid &finalPositions) {
    // 1. Assign column_after_step_1 for each element
    // Matching contains the num_columns matchings
    Graph g;
    Tracking track(numColumns);

    auto offset = numColumns;

    // Build bipartite graph. Nodes are the current columns numbered
    // (0, 1, ...) and the destination columns numbered with an offset of
    // numColumns (0 + offset, 1+offset, ...)

    for (auto j = 0; j < numColumns; ++j) {
        add_vertex(g);
    }
    for (auto k = offset; k < offset + numColumns; ++k) {
        add_vertex(g);
    }

    // Add an edge to the graph from (i, j+offset) for every element
    // currently in column i which should go to column j for the new
    // mapping
    for (auto row = 0; row < numRows; ++row) {
        for (auto column = 0; column < numColumns; ++column) {
            auto destination_column = finalPositions[row][column];
            auto hasEdge = edge(column, destination_column + offset, g).second;
            if (!hasEdge) {
                add_edge(column, destination_column + offset, g);
                // Keep manual track of multiple edges between nodes
                track[column][destination_column + offset] = 1;
            } else {
                track[column][destination_column + offset] += 1;
            }
        }
    }

    // Find perfect matching, remove those edges from the graph
    // and do it again:
    for (auto i = 0; i < numRows; ++i) {
        Match mate(numColumns * 2);
        edmonds_maximum_cardinality_matching(g, &mate[0]);
        matchings[i] = mate;
        // Remove all edges of the current perfect matching
        for (auto node = 0; node < numColumns; ++node) {
            auto looper = mate[node];
            auto idx = looper;
            if (track[node][idx] == 1) {
                remove_edge(node, idx, g);
            } else {
                track[node][idx] -= 1;
            }
        }
    }
}

static void jsArrayToPositions(Local<Array> &array, PositionGrid &grid) {
    for (uint32_t j = 0; j < array->Length(); ++j) {
        auto alooper = Local<Array>::Cast(array->Get(j));
        PositionVector vec(alooper->Length());
        for (uint32_t k = 0; k < alooper->Length(); ++k) {
            vec[k] = alooper->Get(k)->Int32Value();
        }
        grid[j] = vec;
    }
}

static void matchingsToJS(Isolate *isolate, int size, std::vector<Match> &mathings, Local<Array> &array) {
    for (size_t j = 0; j < mathings.size(); ++j) {
        auto mLooper = mathings[j];
        auto dict = Object::New(isolate);
        for (auto k = 0; k < size; ++k) {
            dict->Set(k, v8::Integer::New(isolate, mLooper[k]));
        }

        array->Set(j, dict);
    }
}

static void returnNewSwapWrapper(const Nan::FunctionCallbackInfo<v8::Value>& info) {

    if (info.Length() < 2) {
        Nan::ThrowTypeError("Wrong number of arguments");
        return;
    }

    auto isolate = info.GetIsolate();
    auto row = info[0]->Int32Value();
    auto column = info[1]->Int32Value();
    auto array = Local<Array>::Cast(info[2]);
    PositionGrid grid(array->Length());

    jsArrayToPositions(array, grid);

    std::vector<Match> matchings(row);

    returnNewSwap(matchings, row, column, grid);

    auto result = Array::New(isolate, matchings.size());
    matchingsToJS(isolate, column * 2, matchings, result);
    info.GetReturnValue().Set(result);
}

void twodMapperInit(v8::Local<v8::Object> exports) {
    exports->Set(Nan::New("returnNewSwap").ToLocalChecked(),
                 Nan::New<v8::FunctionTemplate>(returnNewSwapWrapper)->GetFunction());
}
