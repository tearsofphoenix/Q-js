//
// Created by Isaac on 2018/8/5.
//

#include <nan.h>
#include "simulator.hpp"

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
};

// implementation

Nan::Persistent<v8::Function> Wrapper::constructor;

Wrapper::Wrapper(int seed) {
    _simulator = new Simulator(seed);
}

Wrapper::~Wrapper() {
    delete _simulator;
}

void Wrapper::Init(v8::Local<v8::Object> exports) {
    Nan::HandleScope scope;

    // Prepare constructor template
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("Wrapper").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    // Prototype
    Nan::SetPrototypeMethod(tpl, "allocateQubit", allocateQubit);
    Nan::SetPrototypeMethod(tpl, "deallocateQubit", deallocateQubit);
    Nan::SetPrototypeMethod(tpl, "getClassicalValue", getClassicalValue);
    Nan::SetPrototypeMethod(tpl, "isClassical", isClassical);
    Nan::SetPrototypeMethod(tpl, "measureQubits", measureQubits);
    Nan::SetPrototypeMethod(tpl, "applyControlledGate", applyControlledGate);
    Nan::SetPrototypeMethod(tpl, "emulateMath", emulateMath);
    Nan::SetPrototypeMethod(tpl, "getExpectationValue", getExpectationValue);
    Nan::SetPrototypeMethod(tpl, "applyQubitOperator", applyQubitOperator);
    Nan::SetPrototypeMethod(tpl, "emulateTimeEvolution", emulateTimeEvolution);
    Nan::SetPrototypeMethod(tpl, "getProbability", getProbability);
    Nan::SetPrototypeMethod(tpl, "getAmplitude", getAmplitude);
    Nan::SetPrototypeMethod(tpl, "setWavefunction", setWavefunction);
    Nan::SetPrototypeMethod(tpl, "collapseWavefunction", collapseWavefunction);
    Nan::SetPrototypeMethod(tpl, "run", run);
    Nan::SetPrototypeMethod(tpl, "cheat", cheat);

    constructor.Reset(tpl->GetFunction());
    exports->Set(Nan::New("Wrapper").ToLocalChecked(), tpl->GetFunction());
}


void Wrapper::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    if (info.IsConstructCall()) {
        // Invoked as constructor: `new MyObject(...)`
        int value = info[0]->IsUndefined() ? 0 : info[0]->NumberValue();
        Wrapper* obj = new Wrapper(value);
        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    } else {
        // Invoked as plain function `MyObject(...)`, turn into construct call.
        const int argc = 1;
        v8::Local<v8::Value> argv[argc] = { info[0] };
        v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
        info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    }
}

void Wrapper::allocateQubit(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    int id = info[0]->NumberValue();
    obj->_simulator->allocate_qubit(id);
}

void Wrapper::deallocateQubit(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    int id = info[0]->NumberValue();
    obj->_simulator->deallocate_qubit(id);
}

void Wrapper::getClassicalValue(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    int id = info[0]->NumberValue();
    double calc = info[1]->NumberValue();
    bool result = obj->_simulator->get_classical_value(id, calc);
    info.GetReturnValue().Set(result);
}

void Wrapper::isClassical(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    int id = info[0]->NumberValue();
    double calc = info[1]->NumberValue();
    bool result = obj->_simulator->is_classical(id, calc);
    info.GetReturnValue().Set(result);
}

template <typename T, typename V>
void jsToArray(Local<Array> &jsArray, V ids) {
    for (unsigned int i = 0; i < jsArray->Length(); i++) {
        Handle<Value> val = jsArray->Get(i);
        T numVal = val->NumberValue();
        ids.push_back(numVal);
    }
}

template <typename T>
void arrayToJS(Local<Array> &ret, T &result) {
    for (int i = 0; i < result.size(); ++i) {
        ret->Set(i, Nan::New(result[i]));
    }
}

void Wrapper::measureQubits(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    v8::Local<v8::Array> jsArray = v8::Local<v8::Array>::Cast(info[0]);
    std::vector<bool> result;
    std::vector<unsigned int> ids;
    typename std::vector<unsigned int> V1;
    typename std::vector<bool> V2;
    jsToArray<unsigned int>(jsArray, ids);

    obj->_simulator->measure_qubits(ids, result);

    Local<Array> ret = Nan::New<v8::Array>(result.size());
    arrayToJS(ret, result);

    info.GetReturnValue().Set(ret);
}

void Wrapper::applyControlledGate(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    complex_type I(0., 1.);
    Fusion::Matrix X = {{0., 1.}, {1., 0.}};
    Fusion::Matrix Y = {{0., -I}, {I, 0.}};
    Fusion::Matrix Z = {{1., 0.}, {0., -1.}};
    std::vector<Fusion::Matrix> gates = {X, Y, Z};

    v8::String::Utf8Value val(info[0]->ToString());
    std::string str(*val, val.length());

    v8::Local<v8::Array> idsArray = v8::Local<v8::Array>::Cast(info[1]);
    v8::Local<v8::Array> controlArray = v8::Local<v8::Array>::Cast(info[2]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(idsArray, ids);

    std::vector<unsigned int> ctrl;
    jsToArray<unsigned int>(controlArray, ctrl);

    obj->_simulator->apply_controlled_gate(gates[str[0] - 'X'], ids, ctrl);
}

void Wrapper::emulateMath(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Function> cbFunc = Local<Function>::Cast(info[0]);
    Nan::Callback cb(cbFunc);

    auto f = [&](std::vector<int>& x) {
        const int argc = 1;
        v8::Local<v8::Value> args1[argc];
        Local<Array> arg = Nan::New<v8::Array>(x.size());
        arrayToJS(arg, x);
        args1[0] = arg;

        Local<Array> result = Local<Array>::Cast(cb.Call(argc, args1));
        std::vector<int> ret(result->Length());
        x = std::move(ret);
    };
    v8::Local<v8::Array> quregArray = v8::Local<v8::Array>::Cast(info[1]);
    QuRegs regs(quregArray->Length());
    for (int i = 0; i < quregArray->Length(); ++i) {
        Local<Value> val = quregArray->Get(i);
        Local<Array> qr = Local<Array>::Cast(val);
        std::vector<unsigned int> item;
        jsToArray<unsigned int>(qr, item);
        regs.push_back(item);
    }

    Local<Array> ctrlArray = Local<Array>::Cast(info[2]);
    std::vector<unsigned int> ctrls;
    jsToArray<unsigned int>(ctrlArray, ctrls);

    obj->_simulator->emulate_math(f, regs, ctrls);
}

void Wrapper::getExpectationValue(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
}