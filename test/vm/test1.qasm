OPENQASM 2.0;
include "qelib1.inc";

qreg q[5];
creg c[5];

x q[0];

measure q -> c;
