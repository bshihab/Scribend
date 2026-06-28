# Scribend native build  —  Developer 1 (Execution & NDK Lead)
# Builds libscribend.so, loaded from Kotlin via System.loadLibrary("scribend").
cmake_minimum_required(VERSION 3.22.1)
project("scribend")

add_library(scribend SHARED
        native-lib.cpp)

# Android logging (used once we add __android_log_print debugging).
find_library(log-lib log)

target_link_libraries(scribend
        ${log-lib})

# ---------------------------------------------------------------------------
# LATER (real phase): add ExecuTorch + QNN here, e.g.
#   target_link_libraries(scribend executorch qnn_executorch_backend ${log-lib})
# and point include/lib dirs at the ExecuTorch AAR/prebuilt libs.
# ---------------------------------------------------------------------------
