---
aliases: []
title: WSL에서 Jupyter notebook 윈도우 브라우저로 열기
author: Aqudi
category: tip
categories: [tip]
tags: [jupyter, wsl]
date: 2020-09-16 09:09:02+0900
last_modified_at: 2023-09-07 23:34:58+0900
---
## Jupyter notebook 설치
```shell
pip3 install jupyter
```

## Jupyter notebook 설정파일 생성
```shell
jupyter notebook --generate-config
```

## 아래의 항목 False로 변경
```shell
c.NotebookApp.use_redirect_file = False
```

## 환경변수 등록하기
```shell
echo "export BROWSER='<자신이사용하는 브라우저 경로>'" >> <쉘설정파일 경로>

예시)
echo "export BROWSER='/mnt/c/Program Files (x86)/Naver/Naver Whale/Application/whale.exe'" >> ~/.zshrc
```
+ 자신이 주로 사용하는 브라우저의 경로로 설정 (ex. chrome.exe)
+ 자신이 사용하는 쉘의 설정파일로 변경 (ex. bashrc)
