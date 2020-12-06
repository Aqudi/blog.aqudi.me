---
title: Spark 완벽 가이드 18장 모니터링과 디버깅
date: 2020-12-06 17:12:27
category: spark
thumbnail: { thumbnailSrc }
draft: false
---

이전 스터디에서 공부했던 15장을 바탕으로
이 장에서는 어떤 부분을 모니터링하고 디버깅해야 하는지를 소개합니다.

## 모니터링과 디버깅

### 모니터링 범위

모니터링을 스파크가 사용하는 모든 자원에 걸쳐서 수행해야
정확한 오류 발생 지점을 찾아낼 수 있습니다.

- 스파크 애플리케이션 잡
  - 디버깅을 위해서 스파크 모니터링 도구들을 가장 먼저 확인해야합니다.
  - 클러스터에서 실행되고 있는 애플리케이션의 RDD와 쿼리 실행 계획 같은 개념적 수준의 정보를 제공합니다.
  - 스파크 모니터링 도구 종류
    - 스파크 UI
    - 스파크 로그
- JVM
  - 스파크의 Excutor들은 개별 JVM에서 실행됩니다.
  - 코드 실행과정을 이해하기 위해서서는 JVM의 도구를 사용해 모니터링해야합니다.
  - 이 중 일부 정보들은 스파크 UI에서도 확인이 가능하지만 저수준 디버깅이 필요할 때는 JVM 도구가 더 유용합니다.
  - JVM 도구 종류
    - jstack : 스택트레이스
    - jmap : 힙 덤프 생성
    - jstat : 시계열 통계 리포트 제공
    - jconsole : JVM 속성 변수들을 시각화
    - jvisualvm : 스파크 잡의 특성을 알아보는데 도움이 되는 도구
- OS와 머신
  - JVM은 호스트 운영체제에서 실행되기 때문에 머신의 상태를 모니터링하는 것도 중요합니다.
  - CPU, Network, I/O 등의 자원에 대한 모니터링도 해야합니다.
  - 모니터링 도구 종류
    - dsta
    - iostat
    - iotop
- 클러스터
  - 스파크 애플리케이션이 실행되는 클러스터
  - 클러스터 매니저 종류
    - YARN
    - Mesos
    - Spark standalone
  - 클러스터 모니터링 도구 종류
    - [Ganglia](http://ganglia.info/)
    - [Prometheus](https://prometheus.io/)

### 모니터링 대상

#### 프로세스 (CPU, Memory 사용률 등)

- 드라이버 프로세스
  - 스파크의 드라이버에는 모든 애플리케이션의 상태가 보관되어 있습니다.
  - 드라이버의 프로세스를 모니터링하면 애플리케이션이 안정적으로 실행중인지 확인할 수 있습니다.
- 익스큐터 프로세스
  - 스파크에서는 [Dropwizrd metrics library](https://metrics.dropwizard.io/4.1.2/)기반의 metric system을 갖추고 있습니다.
  - 메트릭 시스템
    - \$SPARK_HOME/conf/metrics.properties 파일을 생성해 구성가능
    - 메트릭을 클러스터 모니터링 솔루션을 포함한 다양한 시스템으로 보낼 수 있다.

#### 프로세스 내부의 쿼리 실행과정

- 쿼리, Job, Stage, Task 각각의 정보를 확인 가능합니다.

## 스파크 로그

- 로그레벨 (아래로 내려갈 수록 더 자세합니다.)

  - OFF
  - FATAL
  - ERROR
  - WARN
  - INFO
  - DEBUG
  - TRACE
  - ALL

- 로그레벨 활성화하는 방법

  ```scala
  spark.sparkContext.setLogLevel("INFO")
  ```

- 다른 로깅 프레임워크를 사용해도
- 스파크 로그는 클러스터 매니저의 웹 UI로도 조회가 가능합니다.
- [링크](https://github.com/FVBros/Spark-The-Definitive-Guide/tree/master/project-templates)의 project template을 확인하시면 어떻게 사용하는지를 확인하실 수 있습니다.

## 스파크 UI

스파크 UI는 SparkContext 실행시 4040 포트로 기본 실행됩니다.  
로컬모드를 사용중이시라면 http://localhost:4040 에 접속하시면 웹 UI를 이용할 수 있습니다.

- 탭 구성은 다음 사진처럼 Job, Stages, Storage, Environment, Executors, SQL로 되어있습니다.
  - 이 중 SQL탭은 제가 확인해봤을 때는 sql 명령문을 실행한 후에 생성됐습니다.  
    ![tab-structure](./18장/spark-ui-tab.png)
- 자세한 예제는 책을 참고해주세요.

### 스파크 UI 설정하기

- 다양한 속성으로 스파크 UI를 설정 가능합니다.  
  [스파크 UI 설정 관련 문서](http://spark.apache.org/docs/latest/monitoring.html#spark-configuration-options)

### 스파크 REST API

- 스파크 UI 외에도 REST API로도 같은 정보를 확인할 수 있습니다.  
  [스파크 REST API 관련 문서](http://spark.apache.org/docs/latest/monitoring.html#rest-api)

### 스파크 UI 히스토리 서버

- 이벤트 로그를 저장하도록 설정하면 이전 기록들도 로그를 기반으로 확인할 수 있습니다.
- 마찬가지로 웹으로 확인이 가능하며 18080포트를 기본으로 사용합니다.  
  http://localhost:18080
- `spark-defaults.conf`에 정의된 `spark.eventLog.enabled` 속성을 `true`로 설정하시면 `spark.evenLog.dir`에 정의된 폴더로 이벤트 로그가 저장됩니다. (제 경우에는 설정 파일이 `/usr/spark/conf`에 저장되어 있었습니다.)
- 아래 링크에 히스토리 서버 관련된 더 자세한 정보와 적용할 수 있는 설정들에 대해서 알아볼 수 있으므로 확인해보시길 바랍니다.  
  [히스토리 서버 문서](https://spark.apache.org/docs/latest/monitoring.html)
- 만약 아래와 같은 에러가 뜬다면 `/tmp/spark-events` 폴더를 만들어주시면 됩니다.  
  ![error](./18장/spark-history-server-error.png)

## 디버깅 및 스파크 응급처치

- 이 섹션은 사례들을 다루고 있으므로 책을 참고해주시면 좋을 것 같습니다.
