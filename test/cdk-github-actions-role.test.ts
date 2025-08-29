import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CdkGithubActionsRole } from "../lib/index";

test("IAM Role Created", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  // WHEN
  new CdkGithubActionsRole(stack, "MyTestConstruct", {
    owner: "my-owner",
    repository: "my-repo",
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::IAM::Role", {
    AssumeRolePolicyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Federated: {
              "Fn::Join": [
                "",
                [
                  "arn:aws:iam::",
                  { Ref: "AWS::AccountId" },
                  ":oidc-provider/token.actions.githubusercontent.com",
                ],
              ],
            },
          },
          Action: "sts:AssumeRoleWithWebIdentity",
        },
      ],
    },
  });
});
