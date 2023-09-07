---
aliases: []
title: Spark 완벽 가이드 22장
author: Aqudi
categories: [spark]
tags: [Spark, Book, Study]
date: 2020-12-19 17:12:00+0900
last_modified_at: 2023-09-07 23:40:04+0900
---
이 장에서는 구조적 스트리밍의 핵심 개념과 기초 API에 이어서
이벤트 시간처리와 상태 기반 처리에 대해서 자세히 알아봅니다.

## 처리 시간과 이벤트 시간

- 처리 시간 : 이벤트가 시스템에 도착한 시간
- 이벤트 시간 : 이벤트가 발생한 시간

## 이벤트 시간 기준 처리의 특징

- 이벤트가 발생한 시간을 기준으로 처리를 하기 때문에 늦게 도착한 이벤트도 처리할 수 있다.
- 이벤트 시간 기준 처리를 하기 위해서는 관련된 상태들을 유지하고 있어야 한다.

## 상태 기반 처리

### 필요한 상황

- 오랜 시간에 걸쳐 중간 처리 정보(상태)를 사용하거나 갱신하는 경우
- 이벤트 시간을 사용하거나 키에 대한 집계를 사용하는 경우 (즉, 이전 상태가 필요한 경우)

### 스파크에서 제공해주는 것

- 인메모리 상태 저장소
- 중간 상태를 체크포인트 디렉터리에 백업

### 임의적인 상태 기반 처리

- 상태의 유형, 갱신 방법, 제거 시점을 임의로 생성할 수 있다.

## 22.7 임의적인 상태 기반 처리

#### 필요한 상황

- 특정 키의 개수를 기반으로 윈도우를 만들고 싶을 때
- 특정 시간 범위 안에 일정 개수 이상의 이벤트가 있는 경우 알림을 발생시키고 싶을 때
- 결정되지 않은 시간 동안 사용자 세션을 유지하고 향후 분석을 위해 세션을 저장하고 싶을 때

#### 처리 유형

1. mapGroupsWithState : 각 그룹에서 최대 한 개의 Row를 만들어낼 때
2. flatMapGroupsWithState : 각 그룹에서 하나 이상의 Row를 만들어낼 때

#### 주의사항

윈도우와 워터마크를 사용하면 윈도우의 시작 시각이 워터마크보다 작아질 때 윈도우를 제거할 수 있다.

하지만 임의적인 상태 기반 처리를 할 때는 사용자가 정의한 개념에 따라 상태를 관리해야 하므로 해당 내용들을 구현해야한다.

## 22.7.3 mapGroupsWithState

데이터셋을 입력받고 값을 특정 키로 분배하는 사용자 정의 집계 함수와 유사하다.

### 정의해야할 사항들

- 입력 클래스, 상태 클래스, 출력 클래스
- 키, 이벤트 이터레이터, 이전 상태를 기반으로 상태를 갱신하는 함수
- 타임아웃 파라미터
  - 처리 시간 기반 타임아웃 : GroupState.setTimeoutDuration()
  - 이벤트 시간 기준 타임아웃 : GroupSTate.setTimeoutTimestamp()

### 예제1: 처음과 마지막 타임스탬프 찾기

입력, 상태, 출력 케이스 클래스

```scala
case class InputRow(user:String, timestamp:java.sql.Timestamp, activity:String)
case class UserState(user:String,
  var activity:String,
  var start:java.sql.Timestamp,
  var end:java.sql.Timestamp)
```

특정 로우의 상태를 갱신하는 함수

```scala
def updateUserStateWithEvent(state:UserState, input:InputRow):UserState = {
  if (Option(input.timestamp).isEmpty) {
    return state
  }
  if (state.activity == input.activity) {

    if (input.timestamp.after(state.end)) {
      state.end = input.timestamp
    }
    if (input.timestamp.before(state.start)) {
      state.start = input.timestamp
    }
  } else {
    if (input.timestamp.after(state.end)) {
      state.start = input.timestamp
      state.end = input.timestamp
      state.activity = input.activity
    }
  }
  state
}
```

에포크 기준으로 상태를 갱신하는 함수

```scala
import org.apache.spark.sql.streaming.{GroupStateTimeout, OutputMode, GroupState}
def updateAcrossEvents(user:String,
  inputs: Iterator[InputRow],
  oldState: GroupState[UserState]):UserState = {
  var state:UserState = if (oldState.exists) oldState.get else UserState(user,
        "",
        new java.sql.Timestamp(6284160000000L),
        new java.sql.Timestamp(6284160L)
    )
  // we simply specify an old date that we can compare against and
  // immediately update based on the values in our data

  for (input <- inputs) {
    state = updateUserStateWithEvent(state, input)
    oldState.update(state)
  }
  state
}
```

실제 쿼리를 실행하는 부분

- 이 예제에서는 mapGroupsWithState에 NoTimeout을 넣어서 타임아웃이 발생하지 않도록 지정했다.

```scala
import org.apache.spark.sql.streaming.GroupStateTimeout

withEventTime
.selectExpr("User as user", "cast(Creation_Time/1000000000 as timestamp) as timestamp", "gt as activity")
.as[InputRow]
.groupByKey(_.user)
.mapGroupsWithState(GroupStateTimeout.NoTimeout)(updateAcrossEvents)
.writeStream
.queryName("example1")
.format("memory")
.outputMode("update")
.start()
```

데이터 출력

```scala
spark.sql("SELECT * FROM example1").show()
```

### 예제2: 카운트 기반 윈도우

입력, 상태, 출력 케이스 클래스

```scala
case class InputRow(device: String, timestamp: java.sql.Timestamp, x: Double)
case class DeviceState(device: String, var values: Array[Double],
  var count: Int)
case class OutputRow(device: String, previousAverage: Double)
```

특정 로우의 상태를 갱신하는 함수

```scala
def updateWithEvent(state:DeviceState, input:InputRow):DeviceState = {
  state.count += 1
  // maintain an array of the x-axis values
  state.values = state.values ++ Array(input.x)
  state
}
```

에포크 기준으로 상태를 갱신하는 함수

```scala
import org.apache.spark.sql.streaming.{GroupStateTimeout, OutputMode,
  GroupState}

def updateAcrossEvents(device:String, inputs: Iterator[InputRow],
  oldState: GroupState[DeviceState]):Iterator[OutputRow] = {
  inputs.toSeq.sortBy(_.timestamp.getTime).toIterator.flatMap { input =>
    val state = if (oldState.exists) oldState.get
      else DeviceState(device, Array(), 0)

    val newState = updateWithEvent(state, input)
    if (newState.count >= 500) {
      // One of our windows is complete; replace our state with an empty
      // DeviceState and output the average for the past 500 items from
      // the old state
      oldState.update(DeviceState(device, Array(), 0))
      Iterator(OutputRow(device,
        newState.values.sum / newState.values.length.toDouble))
    }
    else {
      // Update the current DeviceState object in place and output no
      // records
      oldState.update(newState)
      Iterator()
    }
  }
}
```

실제 쿼리를 실행하는 부분

```scala
import org.apache.spark.sql.streaming.GroupStateTimeout

withEventTime
  .selectExpr("Device as device",
    "cast(Creation_Time/1000000000 as timestamp) as timestamp", "x")
  .as[InputRow]
  .groupByKey(_.device)
  .flatMapGroupsWithState(OutputMode.Append,
    GroupStateTimeout.NoTimeout)(updateAcrossEvents)
  .writeStream
  .queryName("count_based_device")
  .format("memory")
  .outputMode("append")
  .start()
```

데이터 출력

```scala
spark.sql("SELECT * FROM count_based_device").show()
```

## 22.7.4 flatMapGroupsWithState

출력 결과가 여러개 만들어지는 것을 제외하면 mapGroupsWithState와 유사하다.

### 정의해야할 사항들

- 입력 클래스, 상태 클래스, 출력 클래스 (선택적으로)
- 키, 이벤트 이터레이터, 이전 상태를 기반으로 상태를 갱신하는 함수
- 타임아웃 파라미터

### 예제3: 세션화

입력, 상태, 출력 케이스 클래스

```scala
case class InputRow(uid:String, timestamp:java.sql.Timestamp, x:Double,
  activity:String)
case class UserSession(val uid:String, var timestamp:java.sql.Timestamp,
  var activities: Array[String], var values: Array[Double])
case class UserSessionOutput(val uid:String, var activities: Array[String],
  var xAvg:Double)
```

특정 로우의 상태를 갱신하는 함수

```scala
def updateWithEvent(state:UserSession, input:InputRow):UserSession = {
  // handle malformed dates
  if (Option(input.timestamp).isEmpty) {
    return state
  }

  state.timestamp = input.timestamp
  state.values = state.values ++ Array(input.x)
  if (!state.activities.contains(input.activity)) {
    state.activities = state.activities ++ Array(input.activity)
  }
  state
}
```

에포크 기준으로 상태를 갱신하는 함수

```scala
import org.apache.spark.sql.streaming.{GroupStateTimeout, OutputMode,
  GroupState}

def updateAcrossEvents(uid:String,
  inputs: Iterator[InputRow],
  oldState: GroupState[UserSession]):Iterator[UserSessionOutput] = {

  inputs.toSeq.sortBy(_.timestamp.getTime).toIterator.flatMap { input =>
    val state = if (oldState.exists) oldState.get else UserSession(
    uid,
    new java.sql.Timestamp(6284160000000L),
    Array(),
    Array())
    val newState = updateWithEvent(state, input)

    if (oldState.hasTimedOut) {
      val state = oldState.get
      oldState.remove()
      Iterator(UserSessionOutput(uid,
      state.activities,
      newState.values.sum / newState.values.length.toDouble))
    } else if (state.values.length > 1000) {
      val state = oldState.get
      oldState.remove()
      Iterator(UserSessionOutput(uid,
      state.activities,
      newState.values.sum / newState.values.length.toDouble))
    } else {
      oldState.update(newState)
      oldState.setTimeoutTimestamp(newState.timestamp.getTime(), "5 seconds")
      Iterator()
    }
  }
}
```

실제 쿼리를 실행하는 부분

```scala
import org.apache.spark.sql.streaming.GroupStateTimeout

withEventTime.where("x is not null")
  .selectExpr("user as uid",
    "cast(Creation_Time/1000000000 as timestamp) as timestamp",
    "x", "gt as activity")
  .as[InputRow]
  .withWatermark("timestamp", "5 seconds")
  .groupByKey(_.uid)
  .flatMapGroupsWithState(OutputMode.Append,
    GroupStateTimeout.EventTimeTimeout)(updateAcrossEvents)
  .writeStream
  .queryName("session")
  .format("memory")
  .start()
```

데이터 출력

```scala
spark.sql("SELECT * FROM session").show()
```
