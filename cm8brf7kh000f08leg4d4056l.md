---
title: "Serverless 환경에서 배포 전 환경변수 검증 자동화하기: TypeBox와 Bitbucket Pipeline 활용기"
datePublished: Sun Mar 16 2025 14:57:36 GMT+0000 (Coordinated Universal Time)
cuid: cm8brf7kh000f08leg4d4056l
slug: serverless-env-validation-typebox-bitbucket
tags: validation, serverless-framework, typebox

---

## 들어가며

배포 직후, 환경변수가 제대로 설정되지 않아 여러 API가 제대로 작동하지 않는 일이 있었습니다. 다행히 밤에 사용자가 없을 때 문제가 있었던 거라 영향도는 크지 않았지만 앞으로도 계속해서 발생할 수 있는 문제이기 때문에 해결해야 겠다고 생각했습니다. 개발 단계에서 문제가 발견되면 가장 좋겠지만, 현재 팀 상황에서는 백엔드 개발을 혼자 담당하고 있어 코드 리뷰나 검증 프로세스를 갖추기가 쉽지 않았습니다. 그래서 최소한 **배포 전에 자동으로 환경변수를 검증**하는 단계를 마련해야겠다고 판단했고, 이 글을 통해 어떤 방식으로 해결했는지 공유해보려 합니다.

## 문제 상황: 왜 환경변수 검증을 자동화해야 했나

### 장애의 원인

* **누락된 환경변수**: 서버 실행 전에 환경변수를 제대로 확인하지 못해, Lambda를 Serverless Framework로 배포했지만 실제로 서버는 실행되지 않는 치명적인 상황이 발생했습니다.
    
* **복합적인 요인**: 개발 단계에서의 검토 프로세스가 미흡했고, 배포 전 검증 프로세스도 없었으며, 혼자서 밤에 서둘러 배포하다 보니 실수를 놓칠 가능성이 컸습니다. 자동화된 테스트 역시 충분치 않아 문제를 조기에 발견하기 어려웠습니다.
    

### 왜 환경변수 자동화를 고려했나

* **백엔드를 혼자 운영**: 팀 내에 백엔드 담당자가 저 한 명뿐이라, 코드 리뷰나 배포 프로세스를 고도화하기엔 무리가 있었습니다.
    
* **실수 전제**: 사람이 하는 일이니 언제든 실수할 수 있다고 보고, 실수가 발생해도 장애가 최소화되도록 하는 안전장치가 필요했습니다.
    
* **빠른 해결책**: 여러 프로세스를 동시에 개선하기는 어렵지만, 환경변수 검증만큼은 쉽고 빠르게 적용 가능하지만 영향도가 높다고 생각했습니다.
    

이러한 이유로, 배포 파이프라인에서 **환경변수를 자동 검증**하는 단계를 추가하게 되었습니다. 결과적으로, 배포 시점에 유효하지 않은 환경변수나 누락된 값을 미리 잡아낼 수 있어 "아예 API 사용이 불가능 한 상황"을 방지할 수 있었습니다.

## 해결책: TypeBox와 Bitbucket Pipeline을 활용한 환경변수 자동 검증

현재 제가 관리 중인 프로젝트에서는 다음과 같은 기술 스택을 사용하고 있습니다.

* AWS Lambda
    
* Serverless Framework
    
* Fastify(서버 프레임워크)
    
* TypeBox(Fastify 스키마 검증 도구)
    

이 프로젝트에서 환경 변수 스키마를 정의하고 검증하는 작업에도 TypeBox를 도입하게 된 이유는 다음과 같습니다.

1. **Fastify와의 호환성**: 이미 Fastify에서 TypeBox로 스키마 검증을 해왔기에, 이를 확장하여 **환경 변수 검증**에도 손쉽게 적용할 수 있었습니다.
    
2. **팀 차원의 익숙함**: 사내 다른 팀에서도 TypeBox를 적극적으로 활용하고 있어, 이미 팀원들이 사용법에 익숙하다는 장점이 있었습니다.
    
3. **TypeScript 연계 가능성**: TypeBox는 TypeScript 환경에서 객체 스키마를 정의하는 데 유용하며, 타입스크립트 컴파일 단계와 런타임 단계 모두에서 검증을 지원합니다.
    

### 간단한 typebox 스키마 정의 예시

typebox를 활용해 환경변수를 검증할 때는, `Type.Object()`로 각 환경변수를 정의하고, [`Value.Check()`](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#check)나 [**compiler**](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#typecheck-typecompiler) 기능을 이용해 런타임 검증을 수행할 수 있습니다.

```ts
// env-schema.ts
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// 기본적인 예시
const EnvSchema = Type.Object({
  DYNAMO_TABLE_NAME: Type.String(),
  API_KEY: Type.String(),
  // 필요한 다른 변수들...
});

export function validateEnvValues(envObject) {
  const isValid = Value.Check(EnvSchema, envObject);
  if (!isValid) {
    throw new Error('Invalid environment variables detected.');
  }
  return envObject;
}
```

### Serverless Framework 문법으로 정의된 환경변수 검증

Serverless Framework에서는 `serverless.yml` 안에 `environment` 섹션을 정의해 함수별(또는 공통)로 환경변수를 주입할 수 있습니다. 예를 들어 다음과 같이 **스테이지(stage)에 따라** 테이블 이름을 동적으로 설정할 수도 있습니다:

```yaml
service: my-service
provider:
  name: aws
  runtime: nodejs14.x
  stage: ${opt:stage, 'dev'}
  environment:
    DYNAMODB_TABLE_NAME: dynamodb-table-${opt:stage}
    API_KEY: ${env:API_KEY}

functions:
  hello:
    handler: handler.hello
```

#### 어떤 문제가 있을까?

* **동적 레퍼런스 해석 문제**  
    `dynamodb-table-${opt:stage}`와 같은 문법은 **Serverless Framework**가 실제 배포 시점에 `${opt:stage}`를 해석해 최종 문자열로 치환합니다. 하지만 `.env` 파일이나 등에서 불러온 환경변수만 조회할 경우 실제 값을 확인할 수 없거나 누락될 수 있습니다.
    
* **CI/CD 상의 검증 누락**  
    배포 전에 환경변수를 검증한다고 해도, 만약 CI 파이프라인이 동적으로 생성된 환경변수를 알 수 없다면 환경변수를 제대로 검증할 수 없습니다.
    

#### 어떻게 해결했나?

이 문제를 해결하기 위해, **Serverless Framework**가 제공하는 `serverless print` 명령어를 활용합니다. 이 명령어는 `${opt:stage}` 등의 문법을 실제로 해석해, 최종적으로 어떤 환경변수가 정의되는지 YAML로 출력해줍니다.

예를 들어, 다음과 같이 `serverless print` 결과물로 `serverless-printed.yml` 파일을 생성하면

```shell
serverless print --stage $STAGE > serverless-printed.yml
```

최종 해석된 문자열을 다음과 같이 얻을 수 있습니다.

```yaml
provider:
	encironment:
		DYNAMODB_TABLE_NAME: dynamodb-table-dev
		API_KEY: random-string
```

이를 이용하면 다음과 같은 식으로 스크립트 파일을 만들어 **Bitbucket Pipeline**에서 사용 가능합니다:

```ts
// scripts/validate-serverless-env.ts
import fs from 'fs';
import yaml from 'js-yaml';
import { validateEnvValues } from '../env-schema'; // typebox 스키마 함수

// serverless-printed.yml 파일을 읽고, YAML을 파싱한 뒤 검증을 수행하는 스크립트 예시
function main(): void {
  const printedYaml = fs.readFileSync('serverless-printed.yml', 'utf8');
  const printed = yaml.load(printedYaml) as Record<string, any>;

  // 최종 해석된 환경변수 객체 추출
  const environmentVars = printed?.service?.provider?.environment ?? {};

  // 스키마 검증
  validateEnvValues(environmentVars);

  console.log('Environment variables validated successfully.');
}

// 스크립트를 실행하는 메인 함수 호출
main();
```

```yaml
- step:
    name: Validate environment variables
    script:
      - serverless print --stage $STAGE > serverless-printed.yml
      - node scripts/validate-serverless-env.js
```

## 결론

이번 장애를 계기로, “배포 시점에 환경변수가 올바르게 설정되어 있는지 자동으로 점검한다”는 작업이 생각보다 중요하다는 사실을 다시금 깨달았습니다. 특히 Serverless Framework에서는 스테이지(stage)에 따라 환경변수를 동적으로 정의할 수 있는데, 이때 CI/CD 단계에서 **최종 해석된 값**을 검증하지 않으면, 배포 후 예상치 못한 문제가 발생할 수 있습니다.

하지만 이렇게 자동화된 검증 프로세스를 한 번 구축해두고 나니 사람이 검수하는 과정에서 놓치는 오류를 **자동화된 단계**에서 걸러내므로, 꼼꼼히 검토하기 어려운 상황에서 **실수로 인한 장애**를 크게 줄일 수 있습니다. 또한, Fastify와 연계해 이미 TypeBox를 사용 중이라면, 별다른 도구 학습 없이 **환경변수 검증 로직**도 손쉽게 만들 수 있다는 게 큰 장점이었습니다.