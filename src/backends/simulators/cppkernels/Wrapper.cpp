//
// Created by Isaac on 2018/8/5.
//
#include "Wrapper.hpp"

using MatrixType = std::vector<Simulator::StateVector>;

std::ostream& operator<<(std::ostream &os, Simulator::StateVector &vec) {
    os << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        auto item = vec[i];
        os << "(" << item.real() << ", " << item.imag() << ") ";
    }
    os << "]";
    return os;
}

std::ostream& operator<<(std::ostream &os, MatrixType &matrix) {
    os << "[";
    for (size_t i = 0; i < matrix.size(); ++i) {
        auto state = matrix[i];
        os << state;
    }
    os << "]";
    return os;
}

std::ostream& operator<<(std::ostream &os, Simulator::Term &term) {
    os << "[";
    for (size_t i = 0; i < term.size(); ++i) {
        auto item = term[i];
        os << "(" << item.first << ", " << item.second << ")";
    }
    os << "]" << std::endl;
    return os;
}


std::ostream& operator<<(std::ostream &os, Simulator::TermsDict &termsDict) {
    os << "[";
    for (size_t i = 0; i < termsDict.size(); ++i) {
        auto pair = termsDict[i];
        os << pair.first << pair.second << std::endl;
    }
    os << "]";
    return os;
}

std::ostream& operator<<(std::ostream &os, Simulator::ComplexTermsDict &termsDict) {
    os << "[";
    for (size_t i = 0; i < termsDict.size(); ++i) {
        auto pair = termsDict[i];
        os << pair.first << "(" << pair.second.real() << ", " << pair.second.imag() << "i)" << std::endl;
    }
    os << "]";
    return os;
}


std::ostream& operator<<(std::ostream &os, std::vector<bool> &vec) {
    os << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        auto item = vec[i];
        os << item << " ";
    }
    os << "]";
    return os;
}

std::ostream& operator<<(std::ostream &os, std::vector<unsigned int> &vec) {
    os << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        auto item = vec[i];
        os << item << " ";
    }
    os << "]";
    return os;
}

std::ostream& operator<<(std::ostream &os, QuRegs &vec) {
    os << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        auto item = vec[i];
        os << item << " ";
    }
    os << "]";
    return os;
}

// implementation

Nan::Persistent<v8::Function> Wrapper::constructor;

Wrapper::Wrapper(int seed) {
    _simulator = new Simulator(seed);
#if DEBUG
    _logfile.open("./log.txt");
#endif
}

Wrapper::~Wrapper() {
    delete _simulator;
#if DEBUG
    _logfile.close();
#endif
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
        auto value = info[0]->IsUndefined() ? 0 : info[0]->NumberValue();
        Wrapper* obj = new Wrapper(value);
        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    } else {
        // Invoked as plain function `MyObject(...)`, turn into construct call.
        const int argc = 1;
        v8::Local<v8::Value> argv[argc] = { info[0] };
        v8::Local<v8::Function> cons = Nan::New<v8::Function>(constructor);
        #if NODE_MAJOR_VERSION == 10
        auto isolate = info.GetIsolate();
        auto context = isolate->GetCurrentContext();
        auto result = cons->NewInstance(context, argc, argv).ToLocalChecked();
        info.GetReturnValue().Set(result);
        #else
        info.GetReturnValue().Set(cons->NewInstance(argc, argv));
        #endif
    }
}

void Wrapper::allocateQubit(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    unsigned int id = info[0]->Uint32Value();

    try {
        obj->_simulator->allocate_qubit(id);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "allocateQubit: " << id << std::endl;
#endif
}

void Wrapper::deallocateQubit(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    unsigned int id = info[0]->Uint32Value();

    try {
        obj->_simulator->deallocate_qubit(id);
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << "id: " << id << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "deallocateQubit: " << id << std::endl;
#endif
}

void Wrapper::getClassicalValue(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    unsigned int id = info[0]->Uint32Value();
    double calc = info[1]->NumberValue();

    try {
        bool result = obj->_simulator->get_classical_value(id, calc);
        info.GetReturnValue().Set(result);
#if DEBUG
        obj->_logfile << "getClassicalValue: " << id << " result: " << result << std::endl;
#endif
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << "id: " << id << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

void Wrapper::isClassical(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    unsigned int id = info[0]->Uint32Value();
    double calc = info[1]->NumberValue();
    try {
        bool result = obj->_simulator->is_classical(id, calc);
        info.GetReturnValue().Set(result);
#if DEBUG
        obj->_logfile << "isClassical: " << id << " result: " << result << std::endl;
#endif
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << "id: " << id << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

template <typename T, typename V>
void jsToArray(Local<Array> &jsArray, V &ids) {
    for (uint32_t i = 0; i < jsArray->Length(); i++) {
        Handle<Value> val = jsArray->Get(i);
        T numVal = val->Int32Value();
        ids.push_back(numVal);
    }
}

template <typename T>
void arrayToJS(Isolate* isolate, Local<Array> &ret, T &result) {
    for (size_t i = 0; i < result.size(); ++i) {
        ret->Set(i, Number::New(isolate, result[i]));
    }
}

void jsToTermDictionary(Isolate *isolate, Local<Array> &terms, Simulator::TermsDict &dict) {
    for (uint32_t i = 0; i < terms->Length(); ++i) {
        Local<Value> v = terms->Get(i);
        Local<Array> pair = Local<Array>::Cast(v);

        auto a = Local<Array>::Cast(pair->Get(0));
        Simulator::Term t;
        for (uint32_t j = 0; j < a->Length(); ++j) {
            auto aLooper = Local<Array>::Cast(a->Get(j));
            auto gate = aLooper->Get(1)->ToString();
            String::Utf8Value value(isolate, gate);
            auto c = (*value)[0];
            t.push_back(std::make_pair((unsigned)aLooper->Get(0)->Uint32Value(), c));
        }
        dict.push_back(std::make_pair(t, pair->Get(1)->NumberValue()));
    }
}

void jsToComplexTermDictionary(Isolate *isolate, Local<Array> &terms, Simulator::ComplexTermsDict &dict) {
    auto re = String::NewFromUtf8(isolate, "re");
    auto im = String::NewFromUtf8(isolate, "im");

    for (uint32_t i = 0; i < terms->Length(); ++i) {
        Local<Value> v = terms->Get(i);
        Local<Array> pair = Local<Array>::Cast(v);

        auto a = Local<Array>::Cast(pair->Get(0));
        Simulator::Term t;
        for (uint32_t j = 0; j < a->Length(); ++j) {
            auto aLooper = Local<Array>::Cast(a->Get(j));
            auto g = aLooper->Get(1)->ToString();
            String::Utf8Value value(isolate, g);
            t.push_back(std::make_pair((unsigned)aLooper->Get(0)->Uint32Value(), (*value)[0]));
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

void jsToStateVector(Isolate *iso, Local<Array> &array, Simulator::StateVector &vec) {
    auto re = String::NewFromUtf8(iso, "re");
    auto im = String::NewFromUtf8(iso, "im");

    for (uint32_t i = 0; i < array->Length(); ++i) {
        Local<Value> v = array->Get(i);

        if (v->IsNumber()) {
            vec.push_back(Simulator::complex_type(v->NumberValue()));
        } else {
            auto obj = v->ToObject();
            auto reValue = obj->Get(re);
            auto imValue = obj->Get(im);
            vec.push_back(Simulator::complex_type(reValue->NumberValue(), imValue->NumberValue()));
        }
    }
}

void mapToJSObject(Isolate *isolate, Simulator::Map &map, Local<Object> &dict) {
    for (auto i = map.begin(); i != map.end(); ++i) {
        auto key = i->first;
        auto value = i->second;
        auto k1 = Number::New(isolate, key);
        auto v1 = Number::New(isolate, value);

        dict->Set(k1, v1);
    }
}

void stateVectorToJS(Isolate* isolate, Simulator::StateVector &vec, Local<Array> &array) {
    auto re = String::NewFromUtf8(isolate, "re");
    auto im = String::NewFromUtf8(isolate, "im");

    for (size_t i = 0; i < vec.size(); ++i) {
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
    auto isolate = info.GetIsolate();

    v8::Local<v8::Array> jsArray = v8::Local<v8::Array>::Cast(info[0]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(jsArray, ids);

    try {
        auto result = obj->_simulator->measure_qubits_return(ids);

        Local<Array> ret = Array::New(isolate, result.size());
        arrayToJS(isolate, ret, result);

        info.GetReturnValue().Set(ret);
#if DEBUG
        obj->_logfile << "measureQubits: " << ids << " result: " << result << std::endl;
#endif
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

void jsToMatrix(Isolate *iso, Local<Array> &array, MatrixType &m) {
    for (uint32_t i = 0; i < array->Length(); ++i) {
        auto aLooper = Local<Array>::Cast(array->Get(i));
        Simulator::StateVector vector;
        jsToStateVector(iso, aLooper, vector);
        m.push_back(vector);
    }
}

void Wrapper::applyControlledGate(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Isolate *isolate = info.GetIsolate();
    auto mat = Local<Array>::Cast(info[0]);
    MatrixType m;
    jsToMatrix(isolate, mat, m);

    auto idsArray = v8::Local<v8::Array>::Cast(info[1]);
    auto controlArray = v8::Local<v8::Array>::Cast(info[2]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(idsArray, ids);

    std::vector<unsigned int> ctrl;
    jsToArray<unsigned int>(controlArray, ctrl);

    try {
        obj->_simulator->apply_controlled_gate(m, ids, ctrl);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "applyControlledGate: m: " << m << " ids: " << ids << " ctrls: " << ctrl << std::endl;
#endif
}

void Wrapper::emulateMath(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Function> cbFunc = Local<Function>::Cast(info[0]);
    Nan::Callback cb(cbFunc);
    auto isolate = info.GetIsolate();

    auto f = [&](std::vector<int>& x) {
        const int argc = 1;
        v8::Local<v8::Value> args1[argc];
        Local<Array> arg = Array::New(isolate, x.size());
        arrayToJS(isolate, arg, x);
        args1[0] = arg;

        Local<Array> result = Local<Array>::Cast(cb.Call(argc, args1));
        std::vector<int> ret(result->Length());
        jsToArray<int>(result, ret);
        x = std::move(ret);
    };
    v8::Local<v8::Array> quregArray = v8::Local<v8::Array>::Cast(info[1]);
    QuRegs regs(quregArray->Length());
    for (uint32_t i = 0; i < quregArray->Length(); ++i) {
        Local<Value> val = quregArray->Get(i);
        Local<Array> qr = Local<Array>::Cast(val);
        std::vector<unsigned int> item;
        jsToArray<unsigned int>(qr, item);
        regs.push_back(item);
    }

    Local<Array> ctrlArray = Local<Array>::Cast(info[2]);
    std::vector<unsigned int> ctrls;
    jsToArray<unsigned int>(ctrlArray, ctrls);

    try {
        obj->_simulator->emulate_math(f, regs, ctrls);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "emulateMath: f: " << " ids: " << regs << " ctrls: " << ctrls << std::endl;
#endif
}

void Wrapper::getExpectationValue(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    auto isolate = info.GetIsolate();
    Local<Array> terms = Local<Array>::Cast(info[0]);
    Simulator::TermsDict termsDict;
    jsToTermDictionary(isolate, terms, termsDict);

    Local<Array> a2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a2, ids);

    try {
#if DEBUG
        obj->_logfile << "getExpectationValue: terms: " << termsDict << " ids: " << ids << std::endl;
#endif
        auto result = obj->_simulator->get_expectation_value(termsDict, ids);
        info.GetReturnValue().Set(result);
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

void Wrapper::applyQubitOperator(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Isolate *isolate = info.GetIsolate();
    Local<Array> terms = Local<Array>::Cast(info[0]);
    Simulator::ComplexTermsDict termsDict;
    jsToComplexTermDictionary(isolate, terms, termsDict);

    auto a2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a2, ids);

    try {
        obj->_simulator->apply_qubit_operator(termsDict, ids);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "applyQubitOperator: terms: " << termsDict << " ids: " << ids << std::endl;
#endif
}

void Wrapper::emulateTimeEvolution(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    auto isolate = info.GetIsolate();

    auto a1 = Local<Array>::Cast(info[0]);
    auto a2 = info[1]->NumberValue();
    auto a3 = Local<Array>::Cast(info[2]);
    auto a4 = Local<Array>::Cast(info[3]);
    Simulator::TermsDict tdict;
    jsToTermDictionary(isolate, a1, tdict);
    Simulator::calc_type time = a2;
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(a3, ids);
    std::vector<unsigned int> ctrl;
    jsToArray<unsigned int>(a4, ctrl);
#if DEBUG
    obj->_logfile << "emulateTimeEvolution: terms: " << tdict << " ids: " << ids << " ctrl: " << ctrl << " time: " << time << std::endl;
#endif
    try {
        obj->_simulator->emulate_time_evolution(tdict, time, ids, ctrl);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
}

void Wrapper::getProbability(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Array> i1 = Local<Array>::Cast(info[0]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);

    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);

    try {
        Simulator::calc_type result = obj->_simulator->get_probability(bitString, ids);
        info.GetReturnValue().Set(result);
#if DEBUG
        obj->_logfile << "getProbability: bitstring: " << bitString << " ids: " << ids << " result: " << result
                      << std::endl;
#endif
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

void Wrapper::getAmplitude(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    Local<Array> i1 = Local<Array>::Cast(info[0]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);

    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);

    try {
        auto result = obj->_simulator->get_amplitude(bitString, ids);

//    if (result.imag() == 0) {
//        info.GetReturnValue().Set(result.real());
//    } else {
        Local<Object> ret = Object::New(isolate);
        ret->Set(String::NewFromUtf8(isolate, "re"), Number::New(isolate, result.real()));
        ret->Set(String::NewFromUtf8(isolate, "im"), Number::New(isolate, result.imag()));

        info.GetReturnValue().Set(ret);
//    }
#if DEBUG
        obj->_logfile << "getAmplitude: bitstring: " << bitString << " ids: " << ids << " result: " << result
                      << std::endl;
#endif
    } catch (std::runtime_error &error) {
#if DEBUG
        obj->_logfile << " exception" << error.what();
#endif
        Nan::ThrowError(error.what());
    }
}

void Wrapper::setWavefunction(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    auto isolate = info.GetIsolate();
    Local<Array> i1 = Local<Array>::Cast(info[0]);
    Simulator::StateVector vec;
    jsToStateVector(isolate, i1, vec);


    Local<Array> i2 = Local<Array>::Cast(info[1]);
    std::vector<unsigned int> ordering;
    jsToArray<unsigned int>(i2, ordering);

    try  {
        obj->_simulator->set_wavefunction(vec, ordering);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "setWavefunction: wavefunction: " << vec << " ordering: " << ordering << std::endl;
#endif
}

void Wrapper::collapseWavefunction(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());

    Local<Array> i2 = Local<Array>::Cast(info[0]);
    std::vector<unsigned int> ids;
    jsToArray<unsigned int>(i2, ids);

    Local<Array> i1 = Local<Array>::Cast(info[1]);
    std::vector<bool> bitString;
    jsToArray<bool>(i1, bitString);
#if DEBUG
    obj->_logfile << "collapseWavefunction: ids: " << ids << " bitstring: " << bitString << std::endl;
#endif
    try {
        obj->_simulator->collapse_wavefunction(ids, bitString);
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
}

void Wrapper::run(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());
    try {
        obj->_simulator->run();
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
#if DEBUG
    obj->_logfile << "run" << std::endl;
#endif
}

void Wrapper::cheat(const Nan::FunctionCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();

    Wrapper* obj = ObjectWrap::Unwrap<Wrapper>(info.Holder());

    try {
        auto result = obj->_simulator->cheat();

        auto m = std::get<0>(result);
        auto state = std::get<1>(result);

        auto rm = Object::New(isolate);
        auto rs = Array::New(isolate, state.size());

        mapToJSObject(isolate, m, rm);
        stateVectorToJS(isolate, state, rs);

        auto ret = Array::New(isolate, 2);
        ret->Set(0, rm);
        ret->Set(1, rs);

        info.GetReturnValue().Set(ret);
#if DEBUG
        obj->_logfile << "cheat: " << state << std::endl;
#endif
    } catch (std::runtime_error &error) {
        Nan::ThrowError(error.what());
    }
}
