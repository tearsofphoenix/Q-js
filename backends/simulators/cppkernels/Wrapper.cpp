//
// Created by Isaac on 2018/8/5.
//
#include "Wrapper.hpp"

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
    tpl->SetClassName(Nan::New("Simulator").ToLocalChecked());
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
    exports->Set(Nan::New("Simulator").ToLocalChecked(), tpl->GetFunction());
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

void jsToTermDictionary(Local<Array> &terms, Simulator::TermsDict &dict) {
    for (int i = 0; i < terms->Length(); ++i) {
        Local<Value> v = terms->Get(i);
        Local<Array> pair = Local<Array>::Cast(v);

        auto a = Local<Array>::Cast(pair->Get(0));
        Simulator::Term t;
        for (int j = 0; j < a->Length(); ++j) {
            auto aLooper = Local<Array>::Cast(a->Get(j));
            t.push_back(std::make_pair((unsigned)aLooper->Get(0)->Uint32Value(), (char)aLooper->Get(1)->Int32Value()));
        }
        dict.push_back(std::make_pair(t, pair->Get(1)->NumberValue()));
    }
}

void jsToComplexTermDictionary(Local<Array> &terms, Simulator::ComplexTermsDict &dict) {
    auto re =  Nan::New<v8::String>("re").ToLocalChecked();
    auto im =  Nan::New<v8::String>("im").ToLocalChecked();

    for (int i = 0; i < terms->Length(); ++i) {
        Local<Value> v = terms->Get(i);
        Local<Array> pair = Local<Array>::Cast(v);

        auto a = Local<Array>::Cast(pair->Get(0));
        Simulator::Term t;
        for (int j = 0; j < a->Length(); ++j) {
            auto aLooper = Local<Array>::Cast(a->Get(j));
            t.push_back(std::make_pair((unsigned)aLooper->Get(0)->Uint32Value(), (char)aLooper->Get(1)->Int32Value()));
        }

        auto coefficient = pair->Get(1);
        if (coefficient->IsNumber()) {
            dict.push_back(std::make_pair(t, Simulator::complex_type(coefficient->NumberValue())));
        } else {
            auto obj = coefficient->ToObject();
            auto reValue = obj->Get(re);
            auto imValue = obj->Get(im);

            dict.push_back(std::make_pair(t, Simulator::complex_type(reValue->NumberValue(), imValue->NumberValue())));
        }
    }
}

void jsToStateVector(Local<Array> &array, Simulator::StateVector &vec) {
    auto re =  Nan::New<v8::String>("re").ToLocalChecked();
    auto im =  Nan::New<v8::String>("im").ToLocalChecked();

    for (int i = 0; i < array->Length(); ++i) {
        Local<Value> v = array->Get(i);

        if (array->IsNumber()) {
            vec.push_back(Simulator::complex_type(v->NumberValue()));
        } else {
            auto obj = array->ToObject();
            auto reValue = obj->Get(re);
            auto imValue = obj->Get(im);
            vec.push_back(Simulator::complex_type(reValue->NumberValue(), imValue->NumberValue()));
        }
    }
}

void mapToJSObject(Simulator::Map &map, Local<Object> &dict) {
    for (auto i = map.begin(); i != map.end(); ++i) {
        auto key = i->first;
        auto value = i->second;
        auto k1 = Nan::New(key);
        auto v1 = Nan::New(value);
        dict->Set(k1, v1);
    }
}

void stateVectorToJS(Isolate* isolate, Simulator::StateVector &vec, Local<Array> &array) {
    auto re =  Nan::New<v8::String>("re").ToLocalChecked();
    auto im =  Nan::New<v8::String>("im").ToLocalChecked();

    for (int i = 0; i < vec.size(); ++i) {
        auto value = vec[i];

        Local<Object> obj = Object::New(isolate);
        auto reValue = Number::New(isolate, value.real());
        auto imValue = Number::New(isolate, value.imag());
        obj->Set(re, reValue);
        obj->Set(im, imValue);
        array->Set(i, obj);
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
    Local<Array> terms = Local<Array>::Cast(info[0]);
    Simulator::TermsDict termsDict;
    jsToTermDictionary(terms, termsDict);

    Local<Array> a2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a2, ids);

    auto result = obj->_simulator->get_expectation_value(termsDict, ids);
    info.GetReturnValue().Set(result);
}

void Wrapper::applyQubitOperator(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Array> terms = Local<Array>::Cast(info[0]);
    Simulator::ComplexTermsDict termsDict;
    jsToComplexTermDictionary(terms, termsDict);

    auto a2 = Local<Array>::Cast(info[0]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a2, ids);

    obj->_simulator->apply_qubit_operator(termsDict, ids);

}

void Wrapper::emulateTimeEvolution(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());

    auto a1 = Local<Array>::Cast(info[0]);
    auto a2 = info[1]->NumberValue();
    auto a3 = Local<Array>::Cast(info[2]);
    auto a4 = Local<Array>::Cast(info[3]);
    Simulator::TermsDict tdict;
    jsToTermDictionary(a1, tdict);
    Simulator::calc_type time = a2;
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a3, ids);
    std::vector<unsigned int> ctrl;
    jsToArray<unsigned int>(a4, ctrl);

    obj->_simulator->emulate_time_evolution(tdict, time, ids, ctrl);
}

void Wrapper::getProbability(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Array> i1 = Local<Array>::Cast(info[0]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);

    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);
    Simulator::calc_type result = obj->_simulator->get_probability(bitString, ids);
    info.GetReturnValue().Set(result);
}

void Wrapper::getAmplitude(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Array> i1 = Local<Array>::Cast(info[0]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);

    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);

    auto result = obj->_simulator->get_amplitude(bitString, ids);

    Local<Array> ret = Nan::New<v8::Array>(2);
    ret->Set(0, Nan::New(result.real()));
    ret->Set(1, Nan::New(result.imag()));

    info.GetReturnValue().Set(ret);
}

void Wrapper::setWavefunction(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());

    Local<Array> i1 = Local<Array>::Cast(info[0]);
    Simulator::StateVector vec;
    jsToStateVector(i1, vec);


    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ordering;
    jsToArray<unsigned int>(i2, ordering);

    obj->_simulator->set_wavefunction(vec, ordering);
}

void Wrapper::collapseWavefunction(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());

    Local<Array> i2 = Local<Array>::Cast(info[0]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);

    Local<Array> i1 = Local<Array>::Cast(info[1]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);

    obj->_simulator->collapse_wavefunction(ids, bitString);
}

void Wrapper::run(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    obj->_simulator->run();
}

void Wrapper::cheat(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();

    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    auto result = obj->_simulator->cheat();

    auto m = std::get<0>(result);
    auto state = std::get<1>(result);

    auto rm = Object::New(isolate);
    auto rs = Array::New(isolate, state.size());

    mapToJSObject(m, rm);
    stateVectorToJS(isolate, state, rs);

    auto ret = Array::New(isolate, 2);
    ret->Set(0, rm);
    ret->Set(1, rs);

    info.GetReturnValue().Set(ret);
}
