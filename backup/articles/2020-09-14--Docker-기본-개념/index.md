---
title: "Docker 기본 개념"
date: "2020-08-02T17:50Z"
layout: post    
draft: false
path: "/posts/Docker-기본-개념"
category: "Docker"
tags:
  - "Docker"
  - "Container"
  - "가상화"
description: "다들 Docker하는데 Docker가 왜 좋은지 그리고 기존의 Hypervisor 아키텍쳐와 다른 점이 무엇인지 알아보자."
---

# Docker?
Docker는 오픈소스 프로젝트 통상적으로는 Docker Engine을 의미함
Go 언어로 작성됨.

가상화 방법
1. 가상머신 : Host OS 위에 Hypervisor(VMware, VirtualBox) 위에 Gest OS 를 돌리는 구조
2. Docker : chroot, namespace, cgroup을 사용하여 가상화된 공간을 제공, 커널은 호스트의 커널을 사용해 컨테이너를 이미지로 만들었을 때 이미지의 크기가 작음

# 사용법
-i Interactive 모드
-t tty 활성화
-d detatch 모드 : 컨테이너를 백그라운드에서 실행되도록 설정한다.

docker run -i -t <image 이름>

docker create와 차이점
docker run 사용시
pull(이미지가 로컬에 없을 시), create, start, attach(-i -t 옵션 사용시) 과정을 거친다.

exit 또는 Ctrl + D : 실행중인 컨테이너를 정지시키고 나옴
Ctrl + P, D : 쉘에서만 빠져나옴

docker ps 정지되지 않은 컨테이너만 출력
docker ps -a 정지된 컨테이너를 포함한 모든 컨테이너를 출력

docker ps에서 나오는 CONTAINER ID는 12자리만 나옴 전체를 다 볼려면 docker inspect <컨테이너 이름> | grep Id  로 확인가능
이 외에도 IMAGE, COMMAND, CREATED, STATUS, PORTS, NAMES 등 정보가 나온다.

docker rename으로 NAMES에 나오는 컨테이너 이름을 바꿀 수 있다.

정지시키고 삭제
docker stop <컨테이너 이름>
docker rm <컨테이너 이름>

모든 컨테이너 삭제
docker container prune

docker ps를 사용한 컨테이너 삭제 방법
(실행중인모든 컨테이너를 출력, -q : ID만 출력)
docker ps -a -q 

docekr stop $(docker ps -a -q)
docker rm $(docker ps -a -q)

Docker Network
가상머신과 마찬가지로 컨테이너도 가상 IP 주소를 할당받는다.
ifconfig로 확인 가능

외부에서 접근가능하도록 할려면 호스트의 IP와 포트에 바인딩해야한다. -p 옵션 활용

-p 옵션으로 특정포트 (예를 들어 웹서버가 주로 사용하는 80번 포트)에 바인딩했다면
호스트의 IP와 해당 포트를 통해 컨테이너의 NAT IP와 80번 포트로 접근할 수 있게 된다.


-d 로 실행한 컨테이너는 attach가 소용이 없다. (실행중인 프로세스의 로그만 보인다.)
그럴 때 exec를 활용하면 내부의 쉘에 명령을 할 수 있다. (ex. docker exec -i -t <컨테이너이름> /bin/bash <- ls / 등도 가능)

### 도커 볼륨
Docker image 는 불변성을 띈다.
DB정보 등의 데이터, 변경 사항들은 컨테이너에 저장된다.
-> 컨테이너가 삭제되면 모든 정보가 날라간다.
그래서 볼륨을 사용하면 컨테이너의 데이터를 영속적으로 사용할 수 있다.

1. 호스트와 볼륨을 공유  
  아래 옵션으로 디렉토리나 파일을 호스트와 컨테이너가 공유할 수 있다.  
  -v <호스트패스>:<컨테이너패스>

2. 볼륨 컨테이너를 활용  
  --volumes-from <-v 옵션으로 생성한 컨테이너 이름> 으로 볼륨을 공유가능하다.

3. 도커 볼륨 활용  
  도커 볼륨 생성  
  docker volume create --name <볼륨이름>
  도커 볼륨 연결  
  -v <볼륨이름>:<컨테이너패스>

도커 볼륨 전체 삭제
docker volume prune

### 도커 네트워크
ifconfig로 확인했을 때 두 개의 인터페이스가 있다.  
eth0과 lo 내부에서만 사용하는 내부 IP가 할당된다. (172.17.0.x)

외부와 연결하기 위해서 호스트에서 veth라는 인터페이스가 생성된다. (도커 엔진이 컨테이너 생성시 자동으로 생성)

docker0 라는 브릿지는 각 veth 인터페이스와 연결돼 호스트의 eth0와 연결해주는 역할을 한다.

컨테이너 (eth0, lo)
컨테이너(eth0) -> veth -> docker0 -> host(etho0)

사용할 수 있는 네트워크 목록(기본적으로 bridge, host, none이 있다)
docker network ls
docker network inspect bridge 
(기본으로 있는 bridge의 정보, Config에 서브넷과 게이트웨이가 다음과 같이 설정되어 있는 것을 볼 수 있다.
 "Subnet": "172.17.0.0/16", "Gateway": "172.17.0.1")

사용자 정의 네이트워크 브릿지 생성
docker network create --driver birdge mybridge

--net 옵션을 활용해서 연결 가능
docker run -i -t --name mynetwork_container --net mybridge

네트워크 연결을 끊었다가 연결하는 예제 (해당 명령은 브릿지 네트워크, 오버레이 네트워크 등 특정 IP 대역을 가지는 네트워크 모드에만 사용 가능)
docker network disconnect mybridge mynetwork_container
docker network connect mybridge mynetwork_container

사용자 지정 서브넷, 게이트웨이, ip대역폭을 가지는 브릿지 네트워크 생성
docker network create --driver=bridge --subnet=172.72.0.0/16 --ip-range=172.72.0.0/24 --gateway=172.72.0.1 my_custom_network
 



