
#include <nan.h>
#include "simulator.hpp"
#include <iostream>
#include <fstream>

using namespace v8;
using QuRegs = std::vector<std::vector<unsigned>>;

class Wrapper : public Nan::ObjectWrap {
public:
    static void Init(v8::Local<v8::Object> exports);
    using complex_type = std::complex<double>;
private:
    explicit Wrapper(int seed = 1);
    ~Wrapper();

    static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void allocateQubit(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void deallocateQubit(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void getClassicalValue(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void isClassical(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void measureQubits(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void applyControlledGate(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void emulateMath(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void getExpectationValue(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void applyQubitOperator(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void emulateTimeEvolution(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void getProbability(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void getAmplitude(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void setWavefunction(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void collapseWavefunction(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void run(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static void cheat(const Nan::FunctionCallbackInfo<v8::Value>& info);

    static Nan::Persistent<v8::Function> constructor;

    int _seed;
    Simulator *_simulator;
public:
    std::ofstream _logfile;
};
