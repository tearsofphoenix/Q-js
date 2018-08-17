#include <nan.h>
#include "Wrapper.hpp"

void InitAll(v8::Local<v8::Object> exports) {
  Wrapper::Init(exports);
}

NODE_MODULE(addon, InitAll)
