---
aliases: []
title: 쉘스크립트-반목분
author: Aqudi
categories: [tip]
tags: [shell, script]
date: 2020-09-02 17:50:37+0900
last_modified_at: 2023-09-07 23:35:41+0900
---
+ 띄어쓰기로 분리된 요소들 반복
    ```shell
    #!/bin/bash

    for NAME in "차례대로" "출력" "합니다."; do
        echo "단어 : ${NAME} "
    done
    ```

+ 배열을 사용한 for loop
    ```shell
    #!/bin/bash

    SENTENCE=( "괄호로" "묶으면" "리스트입니다." )
    for WORD in ${SENTENCE[@]}; do
        echo "단어 : ${WORD}"
    done
    ```

+ 파이썬이랑 비슷한 for loop
    ```shell
    #!/bin/bash

    for (( i=0; i<5; i++ )); do
        echo "i : ${i}"
    done
    ```

+ Range도 사용가능하다
    ```shell
    #!/bin/bash

    for i in {0..10}; do
        echo "range : ${i}"
    done

    for i in {0..10..2}; do
        echo "range2 : ${i}"
    done
    ```