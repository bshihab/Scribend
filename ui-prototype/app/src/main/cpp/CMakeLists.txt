cmake_minimum_required(VERSION 3.22.1)
project(scribendjni C CXX)

# Developer 3's storage module lives at the repo root (5 levels up from here).
set(LS ${CMAKE_CURRENT_SOURCE_DIR}/../../../../../local-storage)

add_library(scribendjni SHARED
    scribend_jni.cpp
    ${LS}/vendor/sqlite/sqlite3.c            # fetched amalgamation
    ${LS}/vendor/sqlite-vec/sqlite-vec.c     # #includes its 4 sibling .c files
    ${LS}/src/cpp/scribend_store.c           # the C API
)

target_include_directories(scribendjni PRIVATE
    ${LS}/src/cpp
    ${LS}/vendor/sqlite
    ${LS}/vendor/sqlite-vec
)

target_compile_definitions(scribendjni PRIVATE
    SQLITE_CORE
    SQLITE_VEC_STATIC
    SQLITE_THREADSAFE=1
    SQLITE_DQS=0
    SQLITE_DEFAULT_MEMSTATUS=0
    SQLITE_OMIT_DEPRECATED
    SQLITE_ENABLE_MATH_FUNCTIONS
    SQLITE_TEMP_STORE=2
)

find_library(log-lib log)
target_link_libraries(scribendjni ${log-lib} m)
