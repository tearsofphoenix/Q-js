#include <nan.h>
#include "Wrapper.hpp"
#include "2dmapper.hpp"

void InitAll(v8::Local<v8::Object> exports) {
  Wrapper::Init(exports);
  twodMapperInit(exports);
}

NODE_MODULE(addon, InitAll)
