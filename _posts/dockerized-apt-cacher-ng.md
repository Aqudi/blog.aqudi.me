---
layout: blog
title: Dockerized apt-cacher-ng
categories:
  - docker
tags:
  - docker
  - network
  - proxy
date: 2022-07-13T04:22:07.141Z
---
## 문제상황

프로젝트를 할 때 팀원들끼리 환경을 맞추는 것은 굉장히 중요하다. Docker를 사용하면 모든 팀원이 동일한 환경을 사용한다고 가정하고 프로젝트를 진행할 수 있어 각자 사용하는 환경 때문에 발생하는 문제를 최소화할 수 있다. 

하지만 Dockerfile을 작성하면서 apt package 때문에 굉장히 애를 먹고 있다. 갑자기 잘 되던 apt update가 안될 때도 있고, 원래 사용하던 package에서 조금만 바꾸려고 하면 caching된 레이어도 활용할 수 없기 때문에 또 처음부터 다시 빌드 하게 된다. 이 과정이 너무 오래 걸려서 카카오와 같은 한국 미러 서버를 사용하게 되면 제대로 패키지를 찾지 못하는 경우도 발생한다.

이런 점이 너무 답답하여 해결책을 찾던 중 apt-cacher-ng라는 것을 찾게 됐고, 나중에 사용하기 위해 dockerized 하여 정리하려 한다.

## Dockerized apt-cacher-ng

Docker의 공식 문서에도 apt-cacher-ng를 dockerized 하는 내용이 있어 Dockerfile은 아래와 같이 문서에 있는 것을 사용했다.

https://docs.docker.com/samples/apt-cacher-ng/

```dockerfile
# syntax=docker/dockerfile:1
FROM ubuntu

VOLUME ["/var/cache/apt-cacher-ng"]
RUN apt-get update && apt-get install -y apt-cacher-ng

EXPOSE 3142
CMD chmod 777 /var/cache/apt-cacher-ng && /etc/init.d/apt-cacher-ng start && tail -f /var/log/apt-cacher-ng/*
```

그리고 apt-cacher-ng를 활용하기 위해서 간단하게 anaconda를 설치하는 시나리오를 준비해봤다. 다음과 같이 `APT_CACHER_NG_HOST`와 `APT_CACHER_NG_PORT`라는 두 개의 인자를 받아 빌드하는 이미지이다.

```dockerfile
FROM ubuntu:20.04

ARG APT_CACHER_NG_HOST
ARG APT_CACHER_NG_PORT

# Config apt-cacher-ng proxy
RUN echo "Acquire::http { Proxy \"http://$APT_CACHER_NG_HOST:$APT_CACHER_NG_PORT\"; };" >> /etc/apt/apt.conf.d/01proxy

# Install apt packages
RUN apt-get -y update && \ 
    apt-get -y install curl libgl1-mesa-glx libegl1-mesa libxrandr2 libxrandr2 \
    libxss1 libxcursor1 libxcomposite1 libasound2 libxi6 libxtst6 && \ 
    apt-get -y autoremove  && \ 
    apt-get -y clean && \ 
    rm -rf /var/lib/apt/lists/* && \ 
    rm -rf /tmp/*

# Install Anaconda3
RUN curl https://repo.anaconda.com/archive/Anaconda3-2022.05-Linux-x86_64.sh --output ~/anaconda.sh && \
    bash ~/anaconda.sh -b -p $HOME/anaconda3 && \
    echo 'export PATH=$HOME/anaconda3/bin:$PATH' >> ~/.bashrc && \
    $HOME/anaconda3/bin/conda init bash
```

## apt package를 추가했을 때 속도 비교

위의 Dockerfile을 그대로 빌드를 했을 때 걸리는 시간과 tmux를 추가로 설치했을 때 걸리는 시간을 비교해볼 것이다.
