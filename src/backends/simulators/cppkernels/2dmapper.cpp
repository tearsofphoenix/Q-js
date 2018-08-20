#include <iostream>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/bipartite.hpp>
#include <boost/graph/max_cardinality_matching.hpp>

using namespace boost;
typedef adjacency_list <vecS, vecS, undirectedS> vector_graph_t;
typedef std::pair <int, int> E;

typedef std::vector<int> PositionVector;
typedef std::vector<PositionVector> PositionGrid;
typedef std::vector<std::map<int, int>> Tracking;

void returnNewSwap(int numRows, int numColumns, PositionGrid &finalPositions) {
    // 1. Assign column_after_step_1 for each element
    // Matching contains the num_columns matchings
    adjacency_list<> g;
    typedef std::vector<graph_traits<adjacency_list<>>::vertex_descriptor> Match;
    std::vector<Match> matchings(numRows);
    Tracking track(numColumns);

    auto offset = numColumns;

    // Build bipartite graph. Nodes are the current columns numbered
    // (0, 1, ...) and the destination columns numbered with an offset of
    // numColumns (0 + offset, 1+offset, ...)

    for (int j = 0; j < numColumns; ++j) {
        add_vertex(g);
    }
    for (int k = offset; k < offset + numColumns; ++k) {
        add_vertex(g);
    }

    // Add an edge to the graph from (i, j+offset) for every element
    // currently in column i which should go to column j for the new
    // mapping
    for (int row = 0; row < numRows; ++row) {
        for (int column = 0; column < numColumns; ++column) {
            auto destination_column = finalPositions[row][column];
            auto hasEdge = edge(column, destination_column + offset, g).second;
            if (!hasEdge) {
                add_edge(column, destination_column + offset, g);
                // Keep manual track of multiple edges between nodes
                track[column][destination_column + offset] = 1;
            } else {
                track[column][destination_column + offset] = 1;
            }
        }
    }

    // Find perfect matching, remove those edges from the graph
    // and do it again:
    for (int i = 0; i < numRows; ++i) {
        Match mate(numColumns);
        auto flag = checked_edmonds_maximum_cardinality_matching(g, &mate[0]);
        std::cout << flag << " - " << i << std::endl;
        matchings[i] = mate;
        // Remove all edges of the current perfect matching
        for (int node = 0; node < numColumns; ++node) {
            auto looper = mate[node];
            auto idx = looper;
            if (track[node][idx] == 1) {
                remove_edge(node, idx, g);
            } else {
                track[node][idx] -= 1;
            }
        }
    }

    std::cout << "end";
}

int main (int argc, char **argv)
{

//    4 3 [[0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2]]
//    [{0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}, {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}]
    int row = 4;
    int column = 3;
    PositionGrid positionGrid(row);
    for (int j = 0; j < row; ++j) {
        PositionVector vec(column);
        for (int k = 0; k < column; ++k) {
            vec[k] = k;
        }
        positionGrid[j] = vec;
    }
    returnNewSwap(4, 3, positionGrid);
    return 0;
}
