---
title: "Bash shell for loop 예제"
date: "2020-08-02T17:50Z"
layout: post    
draft: false
path: "/posts/Bash-for-loop 예제"
category: "shell script"
tags:
  - "bash"
  - "script"
  - "반복문"
  - "for loop"
description: "자꾸 까먹는 Bash for loop"
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