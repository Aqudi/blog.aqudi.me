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

Docker의 공식 문서에도 apt-cacher-ng를 dockerized 하는 내용이 있다.

https://docs.docker.com/samples/apt-cacher-ng/

실제 Dockerfile은 위 샘플을 따라하면 쉽게 만들 수 있지만 더 쉽게 빌드하는 방법 등을 정리하고자 한다. 먼저 Dockerfile은 샘플에서 ARG를 2개 추가하여 