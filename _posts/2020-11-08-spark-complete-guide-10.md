---
aliases: []
title: Spark 완벽 가이드 10장 Spark SQL
author: Aqudi
last_modified_at: 2023-09-07 23:36:29+0900
categories:
  - spark
tags:
  - Spark
  - Book
  - Study
date: 2020-11-08 15:11:00+0900
---
이전 스터디에서도 DataFrme API로 표현된 코드와 함께 SQL로 변환된 코드들도 함께 봤었지만 10장에서는 Spark SQL에서 꼭 알아둬야하는 핵심내용들과 함께 몇 가지 예시를 추가적으로 제공한다.

## Spark SQL

- Spark SQL은 DB에서 생성된 View나 Table에 SQL 질의문을 실행할 수 있으며 시스템 함수나 사용자 정의 함수를 사용할 수도 있다.
- Spark SQL은 DataFrame과 Datset API에 통합되어 있다.

  - 데이터 변환 시 SQL과 DataFrame의 기능 모두를 사용할 수 있다.
  - SQL과 DataFrame 방식 모두 동일한 코드로 컴파일된다.

## Spark와 Hive

### Hive

- Spark SQL 이전에 사용되던 빅데이터 계의 SQL 접근 계층
- 사실상 표준처럼 사용되었다.
- Facebook에서 개발됐다.

### Spark SQL

- Hive와의 호환성

  - ANSI-SQL과 HiveQL을 모두 지원하는 자체 개발된 SQL Parser가 포함되어 있다.

- DataFrame과의 뛰어난 호환성

- [페이스북 사용사례](https://engineering.fb.com/2016/08/31/core-data/apache-spark-scale-a-60-tb-production-use-case/)

  - 기존에 사용하고 분석 시스템에서 Hive를 Spark SQL로 대체
  - Spark pipeline 사용 시 Hive pipeline 대비 엄청난 성능 개선이 있었다.
    ![CPU Time 분석](https://engineering.fb.com/wp-content/uploads/2016/08/GEzd1wDtz-TWXB0CAAyxeHcAAAAAbj0JAAAB.jpg)[^cputime사진출처]

- 주의할 점
  - Spark SQL은 온라인 트랜잭션 처리(Online transaction processing, OLTP)[^oltp]를 위한 데이터베이스가 아니라 온라인 분석 처리(Online Analytical Processing, OLAP)[^olap]를 위한 데이터베이스로 작동한다.
  - 그렇기 때문에 낮은 지연시간을 요구하는 쿼리를 수행하기에는 적합하지 않다.

## Spark SQL과 Hive와의 관계

- Spark SQL은 Hive Metastore[^hivemetastore]를 사용하기 때문에 Hive와 용이하다.
- Spark SQL에서는 조회활 파일 수를 최소화하기 위해 Hive Metastore에 접속한 후 Metadata를 참조한다.
- Hive와 연동하기 위해서는 [공식문서](https://spark.apache.org/docs/latest/sql-programming-guide.html#interacting-with-different-versions-of-hive-metastore)를 참고해서 몇 가지 설정을 완료해야한다.

## Spark SQL 접근법

1. Spark SQL CLI  
   여타 다른 DBMS에 쿼리를 날리듯이 SQL 문을 작성하면 된다.

   ```shell
   spark-sql
   ```

2. 프로그래밍 SQL 인터페이스
   [Programming SQL interface 실습 노트북](https://colab.research.google.com/drive/1OmbiA6P0JVD4GDSDyWwcl9aOk8cDwtvw?usp=sharing)
   ```scala
   spark.sql("SELECT 1+1").show()
   ```

## Spark SQL Thrift JDBC/ODBC 서버

- Spark는 자바 데이터베이스 연결[^jdbc] 인터페이스를 제공한다.
- Thrift JDBC/ODBC[^odbc] 서버는 HiveServer2 기반으로 만들어졌다.
- 사용자는 Thrift JDBC/ODBC 서버를 경유해 SQL문을 실행할 수 있다.

  - Thrift 서버 실행

    ```shell
    $SPARK_HOME/sbin/start-thriftserver.sh

    # 환경변수를 통해 Thrift 서버의 주소를 변경할 수 있다.
    # spark-submit에서 지원하는 모든 명령행 옵션을 사용할 수 있다.
    export HIVE_SERVER2_THRIFT_PORT=<listening-port>
    export HIVE_SERVER2_THRIFT_BIND_HOST=<listening-host>
    $SPARK_HOME/sbin/start-thriftserver.sh \
      --master <master-uri> \
      ...

    $SPARK_HOME/sbin/start-thriftserver.sh \
      --hiveconf hive.server2.thrift.port=<listening-poart> \
      --hiveconf hive.server2.thrift.bind.host=<listening-host> \
      --master <master-uri> \
      ...
    ```

  - Beeline으로 접속  
     보안 모드로 접속했을 때 비밀번호가 필요하지만, 그렇지 않을 경우 비밀번호는 입력하지 않아도 된다.

    ```shell
    beeline

    beeline> !connect jdbc:hive2://localhost:10000
    ```

## 카탈로그(Catalog)

- Spark SQL에서 가장 높은 단계의 추상화
- Table에 저장된 데이터에 대한 Metadata 뿐만 아니라 Database, Table, 함수, View에 대한 정보를 추상화한다.
- `org.apache.spark.sql.catalog.Catalog`패키지로 사용가능하다.
- Table, Database, 함수 등을 조회하는 유용한 함수를 제공한다.

## 테이블(Table)

- 명령을 실행할 데이터의 구조 (DataFrame과 논리적으로 동일하다.)
- 9장에서 배운 조인, 필터링, 집계 등의 여러 데이터 변환 작업을 수행할 수 있다.
- DataFrame과의 차이점
  - DataFrame은 Programming 언어에서 정의
  - Table은 Database에서 정의한다.
- Table을 생성하면 default Database에 등록된다.
- 주의사항
  - Spark 2.x 버전에서는 Table은 비어있지 않다.
  - 비어있는 View만 존재한다.
  - 그러므로 Table을 지울 시 모든 데이터가 제거된다.

### 관리형 Table과 외부 Table

- Table은 두 가지 중요한 정보를 저장한다.

  1.  Table data
  2.  Table metadata

- 외부 테이블
  - 디스크에 저장된 파일을 이용해서 정의한 Table
- 관리형 테이블

  - DataFrame의 `saveAsTable` 메소드를 실행해서 만든 스파크가 관련된 모든 정보를 추적할 수 있는 Table

  - `saveAsTable` 메소드는spark.sql.warehouse.dir 속성에 정의된 디렉토리 경로에 테이블 데이터를 스파크 포맷으로 변경한 후 저장한다.
  - 기본 저장경로는 `/user/hive/warehouse`이다.

### 테이블 생성하기

- 주의사항

  - `USING JSON` 구문을 사용하지 않을 시 Hive의 SerDe 설정을 사용하게 되는데 Spark 자체 직렬화보다 훨씬 느리다.

- 아래와 같이 데이터를 읽어올 수 있다.

  ```sql
  CREATE TABLE flights (
  DEST_COUNTRY_NAME STRING,
  ORIGIN_COUNTRY_NAME STRING,
  count LONG
  )
  USING JSON
  OPTIONS (path './2015-summary.json')
  ```

- comment를 추가할 수도 있다.

  ```sql
  CREATE TABLE flights (
  DEST_COUNTRY_NAME STRING,
  ORIGIN_COUNTRY_NAME STRING COMMENT "여기가 코멘트",
  count LONG
  )
  USING CSV
  OPTIONS (path './2015-summary.csv')
  ```

- SELECT 결과를 테이블로 생성할 수도 있다.

  ```sql
  CREATE TABLE flights_from_select
  USING parquet AS SELECT * FROM flights
  ```

- 테이블이 없을 시에만 생성할 수도 있다.

  ```sql
  CREATE TABLE IF NOT EXISTS flights_from_select
  AS SELECT * FROM flights
  ```

- 파티셔닝된 데이터셋을 저장해 데이터 레이아웃을 제어할 수도 있다.
  ```sql
  CREATE TABLE partitioned_flights
  USING parquet
  PARTITIONED BY (DEST_COUNTRY_NAME)
  AS
  SELECT DEST_COUNTRY_NAME, ORIGIN_COUNTRY_NAME, count
  FROM flights LIMIT 5
  ```

### 외부 테이블 생성하기

- Spark는 외부 테이블의 Metadata를 관리한다.
- 테이블 데이터는 관리하지 않는다.

```sql
CREATE EXTERNAL TABLE hive_flights (
  DEST_COUNTRY_NAME STRING,
  ORIGIN_COUNTRY_NAME STRING,
  count LONG
)
ROW FORMAT DELIMITED FIELDS TERMINAED BY ','
LOCATION './data/flight-data-hive'
```

### 테이블 데이터 삽입하기

- 테이블의 데이터 삽입은 표준 SQL문법을 따른다.
- 특정 파티션에만 저장하고 싶은 경우 파티션 명세를 추가할 수 있다.

```sql
INSERT INTO partitioned_flights
PARTITION (DEST_COUNTRY_NAME=" UNITED STATES ")
SELECT count, ORIGIN_COUNTRY_NAME
FROM flights
WHERE DEST_COUNTRY_NAME=" UNITED STATES "
LIMIT 12
```

### 메타데이터 확인하기

- 테이블 생성시 추가한 코멘트를 확인하기

  ```sql
  DESCRIBE TABLE flights_csv
  ```

- 파티셔닝 스키마 정보 확인하기

  ```sql
  SHOW PARTITIONS partitioned_flights
  ```

### 메타데이터 갱신하기

- 테이블의 메타데이터를 유지해야 최신의 데이터셋을 읽고 있다는 것을 보장할 수 있다.
- 테이블과 관련된 모든 캐싱된 항목을 갱신
  ```sql
  REFRESH table partitioned_flights
  ```
- 카탈로그에서 관리하는 테이블의 파티션 정보를 갱신
  ```sql
  MSCK REPAIR TABLE partitioned_flights
  ```

### 테이블 제거하기

- 외부 테이블은 제거할 수 있지만 데이터는 삭제되지 않는다.

```sql
-- 테이블 삭제
DROP TABLE flights_csv;

-- 테이블이 존재할 시 삭제
DROP TABLE IF EXISTS flights_csv;
```

### 테이블 캐싱하기

- 테이블 캐싱

  ```sql
  CACHE TABLE flights
  ```

- 캐쉬된 테이블 제거
  ```sql
  UNCACHE TABLE flights
  ```

## 뷰(View)

- View는 사용자에게 Table처럼 보인다.
- 모든 데이터를 새로운 경로에 다시 저장하는 것이 아닌 쿼리 시점에 트랜스포메이션을 수행한다.
- 쿼리 실행계획을 살펴보면 둘 다 같은 코드로 변환되는 것을 확인할 수 있다.

  ```python
   flights = spark.read.format("json")\
      .load("./2015-summary.json")

   just_usa_df = flights.where("dest_country_name = 'United States'")
   print(just_usa_df.selectExpr("*").explain)
  ```

  ```sql
  EXPLAIN SELECT * FROM just_usa_view
  ```

### 뷰 생성

- 기본 뷰 생성

  ```sql
  CREATE VIEW just_usa_view
  AS
  SELECT * FROM flights
  WHERE dest_coutnry_name = 'United States'
  ```

- 현재 세션에서만 사용가능한 임시 뷰도 만들 수 있다.
  ```sql
  CREATE TEMP VIEW just_usa_view_temp
  AS
  SELECT * FROM flights
  WHERE dest_coutnry_name = 'United States'
  ```
- 전역적 임시뷰도 생성할 수 있다.(DB상관없이 사용 가능)

  ```sql
  CREATE GLOBAL TEMP VIEW just_usa_view_temp
  AS
  SELECT * FROM flights
  WHERE dest_coutnry_name = 'United States'
  ```

- 생성된 뷰를 덮어쓸 수도 있다.

  ```sql
  CREATE OR REPLACE TEMP VIEW just_usa_view_temp
  AS
  SELECT * FROM flights
  WHERE dest_coutnry_name = 'United States'
  ```

### 뷰 제거하기

- `TABLE`대신 `VIEW` 키워드를 사용하면된다.

```sql
DROP VIEW IF EXISTS just_usa_view;
```

## 데이터베이스(Database)

- 전체 데이터베이스 목록 확인

  ```sql
  SHOW DATABASE
  ```

- 데이터베이스 생성하기

  ```sql
  CREATE DATABASE test_db
  ```

- 데이터베이스 사용하기

  ```sql
  use test_db
  ```

- 데이터베이스 삭제하가ㅣ
  ```sql
  DROP DATABASE IF EXISTS test_db;
  ```

## 복합 데이터 타입

- 표준 SQL과는 거리가 먼 기능
- 구조체, 리스트, 맵 타입이 존재한다.

### 구조체

- 구조체는 맵에 더 까가운 복합 데이터 타입이다.
- 여러 컬럼이나 표현식을 괄호로 묶으면 생성된다.

- 구조체 생성
  ```sql
  CREATE VIEW IF NOT EXISTS nested_data
  AS
  SELECT (DEST_COUNTRY_NAME, ORIGIN_COUNTRY_NAME) as country, count
  FROM flights
  ```
- 구조체 조회

  ```sql
  -- 구조체 조회
  SELECT * FROM nested_data
  ```

  ```sql
  -- 구조체의 개별 칼럼 조회
  SELECT country.DEST_COUNTRY_NAME, count FROM nested_data
  ```

  ```sql
  -- 구조체의 모든 개별 칼럼 조회
  SELECT country.*, count FROM nested_data
  ```

### 리스트

- collect_list, collect_set 함수를 통해 생성할 수 있다.

- 리스트 조희

  ```sql
  SELECT DEST_COUNTRY_NAME AS new_name, collect_list(count)
  AS flight_counts, collect_set(ORIGIN_COUNTRY_NAME) AS origin_set
  FROM flights
  GROUP BY DEST_COUNTRY_NAME
  ```

  ```sql
  -- 리스트의 특정 위치의 아이템 조회
  SELECT DEST_COUNTRY_NAME AS new_name,
  collect_list(count)[0] AS flight_counts, collect_set(ORIGIN_COUNTRY_NAME) AS origin_set
  FROM flights
  GROUP BY DEST_COUNTRY_NAME
  ```

- explod 함수를 이용한 배열을 로우로 만들기

  ```sql
  CREATE OR REPLACE TEMP VIEW flights_agg AS
  SELECT DEST_COUNTRY_NAME, collect_list(count) AS collected_counts
  FROM flights
  GROUP BY DEST_COUNTRY_NAME

  -- collect 함수와 정확히 반대로 동작한다.
  -- collect 수행 이전의 DataFrame과 동일한 결과를 반환한다.
  SELECT explode(collected_counts), DEST_COUNTRY_NAME
  FROM flights_agg
  ```

### 함수

- Spark SQL 사용가능한 함수 조회

  ```sql
  SHOW FUNCTIONS

  SHOW SYSTEM FUNCTIONS

  SHOW USER FUNCTIONS
  ```

- 사용자 정의 함수

  ```scala
  def power3(number:Double): Double = number * number * number
  spark.udf.register("power3", power3(_:Double):Double)

  SELECT count, power3(count) FROM flights
  ```

### 서브쿼리

- 쿼리 안에 쿼리를 지정할 수 있도록 지원하는 기능

#### 상호연관 서브쿼리

- 서브쿼리가 사용하는 정보가 쿼리 외부 범위에 있는 경우

#### 비상호연관 서브쿼리

- 서브쿼리가 사용하는 정보가 서브쿼리 내부에만 있는 경우

[^cputime사진출처]: https://engineering.fb.com/2016/08/31/core-data/apache-spark-scale-a-60-tb-production-use-case/
[^oltp]: [wikipedia - 온라인 트랜잭션 처리](https://ko.wikipedia.org/wiki/%EC%98%A8%EB%9D%BC%EC%9D%B8_%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98_%EC%B2%98%EB%A6%AC)
[^olap]: [wikipedia - 온라인 분석 처리](https://ko.wikipedia.org/wiki/%EC%98%A8%EB%9D%BC%EC%9D%B8_%EB%B6%84%EC%84%9D_%EC%B2%98%EB%A6%AC)
[^hivemetastore]: Hive Metastore는 여러 세션에서 사용할 테이블 정보를 보관하고 있다.
[^jdbc]: Java Database Connectivity
[^odbc]: Open Database Connectivity
