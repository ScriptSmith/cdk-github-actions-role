import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

const CDK_QUALIFIER = "hnb659fds";

export interface CdkGithubRoleProps {
  // The owner of the repository (user or organization)
  readonly owner: string;

  // The name of the repository
  readonly repository: string;

  // The name of the role to be created
  readonly roleName?: string;

  // The description of the role
  readonly description?: string;

  // The tags to be applied to the role
  readonly tags?: { [key: string]: string };

  // The GitHub OIDC provider
  // NOTE: This only needs to be created once per account
  readonly provider?: cdk.aws_iam.IOpenIdConnectProvider;

  // The subject claims to be used for the role
  // Defaults to `*` which matches any subject
  // https://docs.github.com/en/actions/reference/security/oidc#example-subject-claims
  readonly subjectClaims?: string[];

  // The additional role ARNs to be used as principals for the role
  readonly additionalPrincipals?: cdk.aws_iam.IPrincipal[];

  // The permissions boundary to be applied to the role
  readonly permissionsBoundary?: cdk.aws_iam.IManagedPolicy;

  // The max session duration
  readonly maxSessionDuration?: cdk.Duration;

  // The CDK qualifier
  // https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-customizing.html
  readonly cdkQualifier?: string;

  // The account ID of the AWS account where the role will be created
  // Defaults to `cdk.Aws.ACCOUNT_ID`
  readonly accountId?: string;

  // The region of the AWS account where the role will be created
  // Defaults to `cdk.Aws.REGION`
  readonly region?: string;
}

export class CdkGithubActionsRole extends Construct {
  public readonly role: cdk.aws_iam.Role;
  public readonly provider: cdk.aws_iam.IOpenIdConnectProvider;

  constructor(scope: Construct, id: string, props: CdkGithubRoleProps) {
    super(scope, id);

    if (!props.owner || !props.repository) {
      throw new Error("Owner and repository are required");
    }

    const accountId = props.accountId ?? cdk.Aws.ACCOUNT_ID;
    const region = props.region ?? cdk.Aws.REGION;
    const cdkQualifier = props.cdkQualifier ?? CDK_QUALIFIER;
    const subjectClaims = props.subjectClaims ?? ["*"];

    this.provider =
      props.provider ??
      cdk.aws_iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        "GithubOidcProvider",
        `arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com`,
      );
    const principal = new cdk.aws_iam.WebIdentityPrincipal(
      this.provider.openIdConnectProviderArn,
      {
        StringLike: {
          "token.actions.githubusercontent.com:sub": subjectClaims.map(
            (subjectClaim) =>
              `repo:${props.owner}/${props.repository}:${subjectClaim}`,
          ),
        },
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:repository_owner": props.owner,
        },
      },
    );

    this.role = new cdk.aws_iam.Role(this, "CdkDeploymentRole", {
      roleName: props.roleName,
      description:
        props.description ??
        `Minimal role for CI/CD pipelines to deploy CDK v2 applications for ${props.owner}/${props.repository}`,
      assumedBy: new cdk.aws_iam.CompositePrincipal(
        principal,
        ...(props.additionalPrincipals ?? []),
      ),
      permissionsBoundary: props.permissionsBoundary,
      maxSessionDuration: props.maxSessionDuration,
      inlinePolicies: {
        CdkMinimalPolicy: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ["sts:AssumeRole"],
              // https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html
              resources: [
                `arn:aws:iam::${accountId}:role/cdk-${cdkQualifier}-file-publishing-role-${accountId}-${region}`,
                `arn:aws:iam::${accountId}:role/cdk-${cdkQualifier}-lookup-role-${accountId}-${region}`,
                `arn:aws:iam::${accountId}:role/cdk-${cdkQualifier}-image-publishing-role-${accountId}-${region}`,
                `arn:aws:iam::${accountId}:role/cdk-${cdkQualifier}-deploy-role-${accountId}-${region}`,
              ],
            }),
          ],
        }),
      },
    });

    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this.role).add(key, value);
      });
    }
  }
}
