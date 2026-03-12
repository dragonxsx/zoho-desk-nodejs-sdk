/**
 * Auto-generated facade wrapping all per-module Kiota API clients.
 * DO NOT EDIT — regenerate with: npx tsx scripts/generate-facade.ts
 */

import type { RequestAdapter } from "@microsoft/kiota-abstractions";

import { type AccountApiClient, createAccountApiClient } from "../generated/account/accountApiClient.js";
import { type AccountAttachmentApiClient, createAccountAttachmentApiClient } from "../generated/accountAttachment/accountAttachmentApiClient.js";
import { type AccountCommentsApiClient, createAccountCommentsApiClient } from "../generated/accountComments/accountCommentsApiClient.js";
import { type AccountContactMappingInfoApiClient, createAccountContactMappingInfoApiClient } from "../generated/accountContactMappingInfo/accountContactMappingInfoApiClient.js";
import { type AccountDeduplicationApiClient, createAccountDeduplicationApiClient } from "../generated/accountDeduplication/accountDeduplicationApiClient.js";
import { type AccountFollowersApiClient, createAccountFollowersApiClient } from "../generated/accountFollowers/accountFollowersApiClient.js";
import { type AccountSlaApiClient, createAccountSlaApiClient } from "../generated/accountSla/accountSlaApiClient.js";
import { type AccountTimeEntryApiClient, createAccountTimeEntryApiClient } from "../generated/accountTimeEntry/accountTimeEntryApiClient.js";
import { type ActivityApiClient, createActivityApiClient } from "../generated/activity/activityApiClient.js";
import { type AgentApiClient, createAgentApiClient } from "../generated/agent/agentApiClient.js";
import { type AgentPresenceApiClient, createAgentPresenceApiClient } from "../generated/agentPresence/agentPresenceApiClient.js";
import { type AgentSignaturesApiClient, createAgentSignaturesApiClient } from "../generated/agentSignatures/agentSignaturesApiClient.js";
import { type AgentTimeEntryApiClient, createAgentTimeEntryApiClient } from "../generated/agentTimeEntry/agentTimeEntryApiClient.js";
import { type ArticleApiClient, createArticleApiClient } from "../generated/article/articleApiClient.js";
import { type ArticleAttachmentApiClient, createArticleAttachmentApiClient } from "../generated/articleAttachment/articleAttachmentApiClient.js";
import { type ArticleCommentApiClient, createArticleCommentApiClient } from "../generated/articleComment/articleCommentApiClient.js";
import { type ArticleFeedbackApiClient, createArticleFeedbackApiClient } from "../generated/articleFeedback/articleFeedbackApiClient.js";
import { type ArticleTranslationApiClient, createArticleTranslationApiClient } from "../generated/articleTranslation/articleTranslationApiClient.js";
import { type AutomationEngineApiClient, createAutomationEngineApiClient } from "../generated/automationEngine/automationEngineApiClient.js";
import { type AutomationFeatureCountApiClient, createAutomationFeatureCountApiClient } from "../generated/automationFeatureCount/automationFeatureCountApiClient.js";
import { type BackupApiClient, createBackupApiClient } from "../generated/backup/backupApiClient.js";
import { type BadgeApiClient, createBadgeApiClient } from "../generated/badge/badgeApiClient.js";
import { type BlueprintTransitionsApiClient, createBlueprintTransitionsApiClient } from "../generated/blueprintTransitions/blueprintTransitionsApiClient.js";
import { type BugIntegApiClient, createBugIntegApiClient } from "../generated/bugInteg/bugIntegApiClient.js";
import { type BulkImportApiClient, createBulkImportApiClient } from "../generated/bulkImport/bulkImportApiClient.js";
import { type BusinessHourApiClient, createBusinessHourApiClient } from "../generated/businessHour/businessHourApiClient.js";
import { type CallApiClient, createCallApiClient } from "../generated/call/callApiClient.js";
import { type CallCommentsApiClient, createCallCommentsApiClient } from "../generated/callComments/callCommentsApiClient.js";
import { type ChannelApiClient, createChannelApiClient } from "../generated/channel/channelApiClient.js";
import { type CommunityApiClient, createCommunityApiClient } from "../generated/community/communityApiClient.js";
import { type CommunityAttachmentApiClient, createCommunityAttachmentApiClient } from "../generated/communityAttachment/communityAttachmentApiClient.js";
import { type CommunityCategoryApiClient, createCommunityCategoryApiClient } from "../generated/communityCategory/communityCategoryApiClient.js";
import { type CommunityCommentApiClient, createCommunityCommentApiClient } from "../generated/communityComment/communityCommentApiClient.js";
import { type CommunityPreferencesApiClient, createCommunityPreferencesApiClient } from "../generated/communityPreferences/communityPreferencesApiClient.js";
import { type CommunityTopicApiClient, createCommunityTopicApiClient } from "../generated/communityTopic/communityTopicApiClient.js";
import { type CommunityUserApiClient, createCommunityUserApiClient } from "../generated/communityUser/communityUserApiClient.js";
import { type ContactApiClient, createContactApiClient } from "../generated/contact/contactApiClient.js";
import { type ContactAttachmentApiClient, createContactAttachmentApiClient } from "../generated/contactAttachment/contactAttachmentApiClient.js";
import { type ContactCommentsApiClient, createContactCommentsApiClient } from "../generated/contactComments/contactCommentsApiClient.js";
import { type ContactDeduplicationApiClient, createContactDeduplicationApiClient } from "../generated/contactDeduplication/contactDeduplicationApiClient.js";
import { type ContactFollowersApiClient, createContactFollowersApiClient } from "../generated/contactFollowers/contactFollowersApiClient.js";
import { type ContactProfileApiClient, createContactProfileApiClient } from "../generated/contactProfile/contactProfileApiClient.js";
import { type ContactTimeEntryApiClient, createContactTimeEntryApiClient } from "../generated/contactTimeEntry/contactTimeEntryApiClient.js";
import { type ContractApiClient, createContractApiClient } from "../generated/contract/contractApiClient.js";
import { type CountriesAndLanguagesApiClient, createCountriesAndLanguagesApiClient } from "../generated/countriesAndLanguages/countriesAndLanguagesApiClient.js";
import { type CustomViewApiClient, createCustomViewApiClient } from "../generated/customView/customViewApiClient.js";
import { type CustomerHappinessApiClient, createCustomerHappinessApiClient } from "../generated/customerHappiness/customerHappinessApiClient.js";
import { type DashboardMetricsApiClient, createDashboardMetricsApiClient } from "../generated/dashboardMetrics/dashboardMetricsApiClient.js";
import { type DashboardsApiClient, createDashboardsApiClient } from "../generated/dashboards/dashboardsApiClient.js";
import { type DepartmentApiClient, createDepartmentApiClient } from "../generated/department/departmentApiClient.js";
import { type DependencyMappingsApiClient, createDependencyMappingsApiClient } from "../generated/dependencyMappings/dependencyMappingsApiClient.js";
import { type DisplayEntityApiClient, createDisplayEntityApiClient } from "../generated/displayEntity/displayEntityApiClient.js";
import { type DomainMappingApiClient, createDomainMappingApiClient } from "../generated/domainMapping/domainMappingApiClient.js";
import { type EmailFailureAlertApiClient, createEmailFailureAlertApiClient } from "../generated/emailFailureAlert/emailFailureAlertApiClient.js";
import { type EmailTemplatesApiClient, createEmailTemplatesApiClient } from "../generated/emailTemplates/emailTemplatesApiClient.js";
import { type EntityBlueprintsApiClient, createEntityBlueprintsApiClient } from "../generated/entityBlueprints/entityBlueprintsApiClient.js";
import { type EventApiClient, createEventApiClient } from "../generated/event/eventApiClient.js";
import { type EventCommentsApiClient, createEventCommentsApiClient } from "../generated/eventComments/eventCommentsApiClient.js";
import { type FieldApiClient, createFieldApiClient } from "../generated/field/fieldApiClient.js";
import { type FinanceApiClient, createFinanceApiClient } from "../generated/finance/financeApiClient.js";
import { type FollowersApiClient, createFollowersApiClient } from "../generated/followers/followersApiClient.js";
import { type GenericActionApiClient, createGenericActionApiClient } from "../generated/genericAction/genericActionApiClient.js";
import { type HelpcenterApiClient, createHelpcenterApiClient } from "../generated/helpcenter/helpcenterApiClient.js";
import { type HelpcenterGroupsApiClient, createHelpcenterGroupsApiClient } from "../generated/helpcenterGroups/helpcenterGroupsApiClient.js";
import { type HolidayListApiClient, createHolidayListApiClient } from "../generated/holidayList/holidayListApiClient.js";
import { type IMCannedMessageApiClient, createIMCannedMessageApiClient } from "../generated/iMCannedMessage/iMCannedMessageApiClient.js";
import { type IMTemplateMessageApiClient, createIMTemplateMessageApiClient } from "../generated/iMTemplateMessage/iMTemplateMessageApiClient.js";
import { type IM_ChannelApiClient, createIM_ChannelApiClient } from "../generated/iM_Channel/iM_ChannelApiClient.js";
import { type IM_MetricsApiClient, createIM_MetricsApiClient } from "../generated/iM_Metrics/iM_MetricsApiClient.js";
import { type IM_SessionApiClient, createIM_SessionApiClient } from "../generated/iM_Session/iM_SessionApiClient.js";
import { type ImportApiClient, createImportApiClient } from "../generated/import/importApiClient.js";
import { type KBRootCategoryApiClient, createKBRootCategoryApiClient } from "../generated/kBRootCategory/kBRootCategoryApiClient.js";
import { type KBSectionApiClient, createKBSectionApiClient } from "../generated/kBSection/kBSectionApiClient.js";
import { type KbCategoryApiClient, createKbCategoryApiClient } from "../generated/kbCategory/kbCategoryApiClient.js";
import { type KbCategoryLogoApiClient, createKbCategoryLogoApiClient } from "../generated/kbCategoryLogo/kbCategoryLogoApiClient.js";
import { type LabelApiClient, createLabelApiClient } from "../generated/label/labelApiClient.js";
import { type LayoutRuleCriteriaApiClient, createLayoutRuleCriteriaApiClient } from "../generated/layoutRuleCriteria/layoutRuleCriteriaApiClient.js";
import { type LayoutRulesApiClient, createLayoutRulesApiClient } from "../generated/layoutRules/layoutRulesApiClient.js";
import { type LicenseFeaturePlanApiClient, createLicenseFeaturePlanApiClient } from "../generated/licenseFeaturePlan/licenseFeaturePlanApiClient.js";
import { type MailReplyAddressApiClient, createMailReplyAddressApiClient } from "../generated/mailReplyAddress/mailReplyAddressApiClient.js";
import { type ModuleApiClient, createModuleApiClient } from "../generated/module/moduleApiClient.js";
import { type OrganizationApiClient, createOrganizationApiClient } from "../generated/organization/organizationApiClient.js";
import { type PendingApprovalApiClient, createPendingApprovalApiClient } from "../generated/pendingApproval/pendingApprovalApiClient.js";
import { type PermalinkApiClient, createPermalinkApiClient } from "../generated/permalink/permalinkApiClient.js";
import { type PinnedConversationApiClient, createPinnedConversationApiClient } from "../generated/pinnedConversation/pinnedConversationApiClient.js";
import { type ProductApiClient, createProductApiClient } from "../generated/product/productApiClient.js";
import { type ProductAttachmentApiClient, createProductAttachmentApiClient } from "../generated/productAttachment/productAttachmentApiClient.js";
import { type ProfileApiClient, createProfileApiClient } from "../generated/profile/profileApiClient.js";
import { type RecyclebinApiClient, createRecyclebinApiClient } from "../generated/recyclebin/recyclebinApiClient.js";
import { type ReportIntegrationApiClient, createReportIntegrationApiClient } from "../generated/reportIntegration/reportIntegrationApiClient.js";
import { type RoleApiClient, createRoleApiClient } from "../generated/role/roleApiClient.js";
import { type RoutingPreferenceApiClient, createRoutingPreferenceApiClient } from "../generated/routingPreference/routingPreferenceApiClient.js";
import { type RuleGroupApiClient, createRuleGroupApiClient } from "../generated/ruleGroup/ruleGroupApiClient.js";
import { type SearchApiClient, createSearchApiClient } from "../generated/search/searchApiClient.js";
import { type SharingRuleApiClient, createSharingRuleApiClient } from "../generated/sharingRule/sharingRuleApiClient.js";
import { type SkillApiClient, createSkillApiClient } from "../generated/skill/skillApiClient.js";
import { type SkillConfigurationApiClient, createSkillConfigurationApiClient } from "../generated/skillConfiguration/skillConfigurationApiClient.js";
import { type SkillTypeApiClient, createSkillTypeApiClient } from "../generated/skillType/skillTypeApiClient.js";
import { type SubjectAccessRequestApiClient, createSubjectAccessRequestApiClient } from "../generated/subjectAccessRequest/subjectAccessRequestApiClient.js";
import { type SupportEmailDomainApiClient, createSupportEmailDomainApiClient } from "../generated/supportEmailDomain/supportEmailDomainApiClient.js";
import { type SupportPlanApiClient, createSupportPlanApiClient } from "../generated/supportPlan/supportPlanApiClient.js";
import { type TaskApiClient, createTaskApiClient } from "../generated/task/taskApiClient.js";
import { type TaskAttachmentApiClient, createTaskAttachmentApiClient } from "../generated/taskAttachment/taskAttachmentApiClient.js";
import { type TaskCommentsApiClient, createTaskCommentsApiClient } from "../generated/taskComments/taskCommentsApiClient.js";
import { type TaskTimeEntryApiClient, createTaskTimeEntryApiClient } from "../generated/taskTimeEntry/taskTimeEntryApiClient.js";
import { type TaskTimerApiClient, createTaskTimerApiClient } from "../generated/taskTimer/taskTimerApiClient.js";
import { type TeamApiClient, createTeamApiClient } from "../generated/team/teamApiClient.js";
import { type TemplateFoldersApiClient, createTemplateFoldersApiClient } from "../generated/templateFolders/templateFoldersApiClient.js";
import { type ThreadApiClient, createThreadApiClient } from "../generated/thread/threadApiClient.js";
import { type TicketApiClient, createTicketApiClient } from "../generated/ticket/ticketApiClient.js";
import { type TicketApprovalsApiClient, createTicketApprovalsApiClient } from "../generated/ticketApprovals/ticketApprovalsApiClient.js";
import { type TicketAttachmentApiClient, createTicketAttachmentApiClient } from "../generated/ticketAttachment/ticketAttachmentApiClient.js";
import { type TicketCommentApiClient, createTicketCommentApiClient } from "../generated/ticketComment/ticketCommentApiClient.js";
import { type TicketCountApiClient, createTicketCountApiClient } from "../generated/ticketCount/ticketCountApiClient.js";
import { type TicketFollowersApiClient, createTicketFollowersApiClient } from "../generated/ticketFollowers/ticketFollowersApiClient.js";
import { type TicketTagApiClient, createTicketTagApiClient } from "../generated/ticketTag/ticketTagApiClient.js";
import { type TicketTemplateApiClient, createTicketTemplateApiClient } from "../generated/ticketTemplate/ticketTemplateApiClient.js";
import { type TicketTimeEntryApiClient, createTicketTimeEntryApiClient } from "../generated/ticketTimeEntry/ticketTimeEntryApiClient.js";
import { type TicketTimerApiClient, createTicketTimerApiClient } from "../generated/ticketTimer/ticketTimerApiClient.js";
import { type TimeTrackingApiClient, createTimeTrackingApiClient } from "../generated/timeTracking/timeTrackingApiClient.js";
import { type UploadApiClient, createUploadApiClient } from "../generated/upload/uploadApiClient.js";
import { type UserApiClient, createUserApiClient } from "../generated/user/userApiClient.js";
import { type ValidationRuleCriteriaApiClient, createValidationRuleCriteriaApiClient } from "../generated/validationRuleCriteria/validationRuleCriteriaApiClient.js";
import { type ValidationRulesApiClient, createValidationRulesApiClient } from "../generated/validationRules/validationRulesApiClient.js";
import { type WebhookApiClient, createWebhookApiClient } from "../generated/webhook/webhookApiClient.js";
import { type WidgetApiClient, createWidgetApiClient } from "../generated/widget/widgetApiClient.js";

export class ZohoDeskClient {
  private readonly adapter: RequestAdapter;

  private _account?: AccountApiClient;
  private _accountAttachment?: AccountAttachmentApiClient;
  private _accountComments?: AccountCommentsApiClient;
  private _accountContactMappingInfo?: AccountContactMappingInfoApiClient;
  private _accountDeduplication?: AccountDeduplicationApiClient;
  private _accountFollowers?: AccountFollowersApiClient;
  private _accountSla?: AccountSlaApiClient;
  private _accountTimeEntry?: AccountTimeEntryApiClient;
  private _activity?: ActivityApiClient;
  private _agent?: AgentApiClient;
  private _agentPresence?: AgentPresenceApiClient;
  private _agentSignatures?: AgentSignaturesApiClient;
  private _agentTimeEntry?: AgentTimeEntryApiClient;
  private _article?: ArticleApiClient;
  private _articleAttachment?: ArticleAttachmentApiClient;
  private _articleComment?: ArticleCommentApiClient;
  private _articleFeedback?: ArticleFeedbackApiClient;
  private _articleTranslation?: ArticleTranslationApiClient;
  private _automationEngine?: AutomationEngineApiClient;
  private _automationFeatureCount?: AutomationFeatureCountApiClient;
  private _backup?: BackupApiClient;
  private _badge?: BadgeApiClient;
  private _blueprintTransitions?: BlueprintTransitionsApiClient;
  private _bugInteg?: BugIntegApiClient;
  private _bulkImport?: BulkImportApiClient;
  private _businessHour?: BusinessHourApiClient;
  private _call?: CallApiClient;
  private _callComments?: CallCommentsApiClient;
  private _channel?: ChannelApiClient;
  private _community?: CommunityApiClient;
  private _communityAttachment?: CommunityAttachmentApiClient;
  private _communityCategory?: CommunityCategoryApiClient;
  private _communityComment?: CommunityCommentApiClient;
  private _communityPreferences?: CommunityPreferencesApiClient;
  private _communityTopic?: CommunityTopicApiClient;
  private _communityUser?: CommunityUserApiClient;
  private _contact?: ContactApiClient;
  private _contactAttachment?: ContactAttachmentApiClient;
  private _contactComments?: ContactCommentsApiClient;
  private _contactDeduplication?: ContactDeduplicationApiClient;
  private _contactFollowers?: ContactFollowersApiClient;
  private _contactProfile?: ContactProfileApiClient;
  private _contactTimeEntry?: ContactTimeEntryApiClient;
  private _contract?: ContractApiClient;
  private _countriesAndLanguages?: CountriesAndLanguagesApiClient;
  private _customView?: CustomViewApiClient;
  private _customerHappiness?: CustomerHappinessApiClient;
  private _dashboardMetrics?: DashboardMetricsApiClient;
  private _dashboards?: DashboardsApiClient;
  private _department?: DepartmentApiClient;
  private _dependencyMappings?: DependencyMappingsApiClient;
  private _displayEntity?: DisplayEntityApiClient;
  private _domainMapping?: DomainMappingApiClient;
  private _emailFailureAlert?: EmailFailureAlertApiClient;
  private _emailTemplates?: EmailTemplatesApiClient;
  private _entityBlueprints?: EntityBlueprintsApiClient;
  private _event?: EventApiClient;
  private _eventComments?: EventCommentsApiClient;
  private _field?: FieldApiClient;
  private _finance?: FinanceApiClient;
  private _followers?: FollowersApiClient;
  private _genericAction?: GenericActionApiClient;
  private _helpcenter?: HelpcenterApiClient;
  private _helpcenterGroups?: HelpcenterGroupsApiClient;
  private _holidayList?: HolidayListApiClient;
  private _iMCannedMessage?: IMCannedMessageApiClient;
  private _iMTemplateMessage?: IMTemplateMessageApiClient;
  private _iM_Channel?: IM_ChannelApiClient;
  private _iM_Metrics?: IM_MetricsApiClient;
  private _iM_Session?: IM_SessionApiClient;
  private _import?: ImportApiClient;
  private _kBRootCategory?: KBRootCategoryApiClient;
  private _kBSection?: KBSectionApiClient;
  private _kbCategory?: KbCategoryApiClient;
  private _kbCategoryLogo?: KbCategoryLogoApiClient;
  private _label?: LabelApiClient;
  private _layoutRuleCriteria?: LayoutRuleCriteriaApiClient;
  private _layoutRules?: LayoutRulesApiClient;
  private _licenseFeaturePlan?: LicenseFeaturePlanApiClient;
  private _mailReplyAddress?: MailReplyAddressApiClient;
  private _module?: ModuleApiClient;
  private _organization?: OrganizationApiClient;
  private _pendingApproval?: PendingApprovalApiClient;
  private _permalink?: PermalinkApiClient;
  private _pinnedConversation?: PinnedConversationApiClient;
  private _product?: ProductApiClient;
  private _productAttachment?: ProductAttachmentApiClient;
  private _profile?: ProfileApiClient;
  private _recyclebin?: RecyclebinApiClient;
  private _reportIntegration?: ReportIntegrationApiClient;
  private _role?: RoleApiClient;
  private _routingPreference?: RoutingPreferenceApiClient;
  private _ruleGroup?: RuleGroupApiClient;
  private _search?: SearchApiClient;
  private _sharingRule?: SharingRuleApiClient;
  private _skill?: SkillApiClient;
  private _skillConfiguration?: SkillConfigurationApiClient;
  private _skillType?: SkillTypeApiClient;
  private _subjectAccessRequest?: SubjectAccessRequestApiClient;
  private _supportEmailDomain?: SupportEmailDomainApiClient;
  private _supportPlan?: SupportPlanApiClient;
  private _task?: TaskApiClient;
  private _taskAttachment?: TaskAttachmentApiClient;
  private _taskComments?: TaskCommentsApiClient;
  private _taskTimeEntry?: TaskTimeEntryApiClient;
  private _taskTimer?: TaskTimerApiClient;
  private _team?: TeamApiClient;
  private _templateFolders?: TemplateFoldersApiClient;
  private _thread?: ThreadApiClient;
  private _ticket?: TicketApiClient;
  private _ticketApprovals?: TicketApprovalsApiClient;
  private _ticketAttachment?: TicketAttachmentApiClient;
  private _ticketComment?: TicketCommentApiClient;
  private _ticketCount?: TicketCountApiClient;
  private _ticketFollowers?: TicketFollowersApiClient;
  private _ticketTag?: TicketTagApiClient;
  private _ticketTemplate?: TicketTemplateApiClient;
  private _ticketTimeEntry?: TicketTimeEntryApiClient;
  private _ticketTimer?: TicketTimerApiClient;
  private _timeTracking?: TimeTrackingApiClient;
  private _upload?: UploadApiClient;
  private _user?: UserApiClient;
  private _validationRuleCriteria?: ValidationRuleCriteriaApiClient;
  private _validationRules?: ValidationRulesApiClient;
  private _webhook?: WebhookApiClient;
  private _widget?: WidgetApiClient;

  constructor(adapter: RequestAdapter) {
    this.adapter = adapter;
  }

  get account(): AccountApiClient {
    if (!this._account) {
      this._account = createAccountApiClient(this.adapter);
    }
    return this._account;
  }

  get accountAttachment(): AccountAttachmentApiClient {
    if (!this._accountAttachment) {
      this._accountAttachment = createAccountAttachmentApiClient(this.adapter);
    }
    return this._accountAttachment;
  }

  get accountComments(): AccountCommentsApiClient {
    if (!this._accountComments) {
      this._accountComments = createAccountCommentsApiClient(this.adapter);
    }
    return this._accountComments;
  }

  get accountContactMappingInfo(): AccountContactMappingInfoApiClient {
    if (!this._accountContactMappingInfo) {
      this._accountContactMappingInfo = createAccountContactMappingInfoApiClient(this.adapter);
    }
    return this._accountContactMappingInfo;
  }

  get accountDeduplication(): AccountDeduplicationApiClient {
    if (!this._accountDeduplication) {
      this._accountDeduplication = createAccountDeduplicationApiClient(this.adapter);
    }
    return this._accountDeduplication;
  }

  get accountFollowers(): AccountFollowersApiClient {
    if (!this._accountFollowers) {
      this._accountFollowers = createAccountFollowersApiClient(this.adapter);
    }
    return this._accountFollowers;
  }

  get accountSla(): AccountSlaApiClient {
    if (!this._accountSla) {
      this._accountSla = createAccountSlaApiClient(this.adapter);
    }
    return this._accountSla;
  }

  get accountTimeEntry(): AccountTimeEntryApiClient {
    if (!this._accountTimeEntry) {
      this._accountTimeEntry = createAccountTimeEntryApiClient(this.adapter);
    }
    return this._accountTimeEntry;
  }

  get activity(): ActivityApiClient {
    if (!this._activity) {
      this._activity = createActivityApiClient(this.adapter);
    }
    return this._activity;
  }

  get agent(): AgentApiClient {
    if (!this._agent) {
      this._agent = createAgentApiClient(this.adapter);
    }
    return this._agent;
  }

  get agentPresence(): AgentPresenceApiClient {
    if (!this._agentPresence) {
      this._agentPresence = createAgentPresenceApiClient(this.adapter);
    }
    return this._agentPresence;
  }

  get agentSignatures(): AgentSignaturesApiClient {
    if (!this._agentSignatures) {
      this._agentSignatures = createAgentSignaturesApiClient(this.adapter);
    }
    return this._agentSignatures;
  }

  get agentTimeEntry(): AgentTimeEntryApiClient {
    if (!this._agentTimeEntry) {
      this._agentTimeEntry = createAgentTimeEntryApiClient(this.adapter);
    }
    return this._agentTimeEntry;
  }

  get article(): ArticleApiClient {
    if (!this._article) {
      this._article = createArticleApiClient(this.adapter);
    }
    return this._article;
  }

  get articleAttachment(): ArticleAttachmentApiClient {
    if (!this._articleAttachment) {
      this._articleAttachment = createArticleAttachmentApiClient(this.adapter);
    }
    return this._articleAttachment;
  }

  get articleComment(): ArticleCommentApiClient {
    if (!this._articleComment) {
      this._articleComment = createArticleCommentApiClient(this.adapter);
    }
    return this._articleComment;
  }

  get articleFeedback(): ArticleFeedbackApiClient {
    if (!this._articleFeedback) {
      this._articleFeedback = createArticleFeedbackApiClient(this.adapter);
    }
    return this._articleFeedback;
  }

  get articleTranslation(): ArticleTranslationApiClient {
    if (!this._articleTranslation) {
      this._articleTranslation = createArticleTranslationApiClient(this.adapter);
    }
    return this._articleTranslation;
  }

  get automationEngine(): AutomationEngineApiClient {
    if (!this._automationEngine) {
      this._automationEngine = createAutomationEngineApiClient(this.adapter);
    }
    return this._automationEngine;
  }

  get automationFeatureCount(): AutomationFeatureCountApiClient {
    if (!this._automationFeatureCount) {
      this._automationFeatureCount = createAutomationFeatureCountApiClient(this.adapter);
    }
    return this._automationFeatureCount;
  }

  get backup(): BackupApiClient {
    if (!this._backup) {
      this._backup = createBackupApiClient(this.adapter);
    }
    return this._backup;
  }

  get badge(): BadgeApiClient {
    if (!this._badge) {
      this._badge = createBadgeApiClient(this.adapter);
    }
    return this._badge;
  }

  get blueprintTransitions(): BlueprintTransitionsApiClient {
    if (!this._blueprintTransitions) {
      this._blueprintTransitions = createBlueprintTransitionsApiClient(this.adapter);
    }
    return this._blueprintTransitions;
  }

  get bugInteg(): BugIntegApiClient {
    if (!this._bugInteg) {
      this._bugInteg = createBugIntegApiClient(this.adapter);
    }
    return this._bugInteg;
  }

  get bulkImport(): BulkImportApiClient {
    if (!this._bulkImport) {
      this._bulkImport = createBulkImportApiClient(this.adapter);
    }
    return this._bulkImport;
  }

  get businessHour(): BusinessHourApiClient {
    if (!this._businessHour) {
      this._businessHour = createBusinessHourApiClient(this.adapter);
    }
    return this._businessHour;
  }

  get call(): CallApiClient {
    if (!this._call) {
      this._call = createCallApiClient(this.adapter);
    }
    return this._call;
  }

  get callComments(): CallCommentsApiClient {
    if (!this._callComments) {
      this._callComments = createCallCommentsApiClient(this.adapter);
    }
    return this._callComments;
  }

  get channel(): ChannelApiClient {
    if (!this._channel) {
      this._channel = createChannelApiClient(this.adapter);
    }
    return this._channel;
  }

  get community(): CommunityApiClient {
    if (!this._community) {
      this._community = createCommunityApiClient(this.adapter);
    }
    return this._community;
  }

  get communityAttachment(): CommunityAttachmentApiClient {
    if (!this._communityAttachment) {
      this._communityAttachment = createCommunityAttachmentApiClient(this.adapter);
    }
    return this._communityAttachment;
  }

  get communityCategory(): CommunityCategoryApiClient {
    if (!this._communityCategory) {
      this._communityCategory = createCommunityCategoryApiClient(this.adapter);
    }
    return this._communityCategory;
  }

  get communityComment(): CommunityCommentApiClient {
    if (!this._communityComment) {
      this._communityComment = createCommunityCommentApiClient(this.adapter);
    }
    return this._communityComment;
  }

  get communityPreferences(): CommunityPreferencesApiClient {
    if (!this._communityPreferences) {
      this._communityPreferences = createCommunityPreferencesApiClient(this.adapter);
    }
    return this._communityPreferences;
  }

  get communityTopic(): CommunityTopicApiClient {
    if (!this._communityTopic) {
      this._communityTopic = createCommunityTopicApiClient(this.adapter);
    }
    return this._communityTopic;
  }

  get communityUser(): CommunityUserApiClient {
    if (!this._communityUser) {
      this._communityUser = createCommunityUserApiClient(this.adapter);
    }
    return this._communityUser;
  }

  get contact(): ContactApiClient {
    if (!this._contact) {
      this._contact = createContactApiClient(this.adapter);
    }
    return this._contact;
  }

  get contactAttachment(): ContactAttachmentApiClient {
    if (!this._contactAttachment) {
      this._contactAttachment = createContactAttachmentApiClient(this.adapter);
    }
    return this._contactAttachment;
  }

  get contactComments(): ContactCommentsApiClient {
    if (!this._contactComments) {
      this._contactComments = createContactCommentsApiClient(this.adapter);
    }
    return this._contactComments;
  }

  get contactDeduplication(): ContactDeduplicationApiClient {
    if (!this._contactDeduplication) {
      this._contactDeduplication = createContactDeduplicationApiClient(this.adapter);
    }
    return this._contactDeduplication;
  }

  get contactFollowers(): ContactFollowersApiClient {
    if (!this._contactFollowers) {
      this._contactFollowers = createContactFollowersApiClient(this.adapter);
    }
    return this._contactFollowers;
  }

  get contactProfile(): ContactProfileApiClient {
    if (!this._contactProfile) {
      this._contactProfile = createContactProfileApiClient(this.adapter);
    }
    return this._contactProfile;
  }

  get contactTimeEntry(): ContactTimeEntryApiClient {
    if (!this._contactTimeEntry) {
      this._contactTimeEntry = createContactTimeEntryApiClient(this.adapter);
    }
    return this._contactTimeEntry;
  }

  get contract(): ContractApiClient {
    if (!this._contract) {
      this._contract = createContractApiClient(this.adapter);
    }
    return this._contract;
  }

  get countriesAndLanguages(): CountriesAndLanguagesApiClient {
    if (!this._countriesAndLanguages) {
      this._countriesAndLanguages = createCountriesAndLanguagesApiClient(this.adapter);
    }
    return this._countriesAndLanguages;
  }

  get customView(): CustomViewApiClient {
    if (!this._customView) {
      this._customView = createCustomViewApiClient(this.adapter);
    }
    return this._customView;
  }

  get customerHappiness(): CustomerHappinessApiClient {
    if (!this._customerHappiness) {
      this._customerHappiness = createCustomerHappinessApiClient(this.adapter);
    }
    return this._customerHappiness;
  }

  get dashboardMetrics(): DashboardMetricsApiClient {
    if (!this._dashboardMetrics) {
      this._dashboardMetrics = createDashboardMetricsApiClient(this.adapter);
    }
    return this._dashboardMetrics;
  }

  get dashboards(): DashboardsApiClient {
    if (!this._dashboards) {
      this._dashboards = createDashboardsApiClient(this.adapter);
    }
    return this._dashboards;
  }

  get department(): DepartmentApiClient {
    if (!this._department) {
      this._department = createDepartmentApiClient(this.adapter);
    }
    return this._department;
  }

  get dependencyMappings(): DependencyMappingsApiClient {
    if (!this._dependencyMappings) {
      this._dependencyMappings = createDependencyMappingsApiClient(this.adapter);
    }
    return this._dependencyMappings;
  }

  get displayEntity(): DisplayEntityApiClient {
    if (!this._displayEntity) {
      this._displayEntity = createDisplayEntityApiClient(this.adapter);
    }
    return this._displayEntity;
  }

  get domainMapping(): DomainMappingApiClient {
    if (!this._domainMapping) {
      this._domainMapping = createDomainMappingApiClient(this.adapter);
    }
    return this._domainMapping;
  }

  get emailFailureAlert(): EmailFailureAlertApiClient {
    if (!this._emailFailureAlert) {
      this._emailFailureAlert = createEmailFailureAlertApiClient(this.adapter);
    }
    return this._emailFailureAlert;
  }

  get emailTemplates(): EmailTemplatesApiClient {
    if (!this._emailTemplates) {
      this._emailTemplates = createEmailTemplatesApiClient(this.adapter);
    }
    return this._emailTemplates;
  }

  get entityBlueprints(): EntityBlueprintsApiClient {
    if (!this._entityBlueprints) {
      this._entityBlueprints = createEntityBlueprintsApiClient(this.adapter);
    }
    return this._entityBlueprints;
  }

  get event(): EventApiClient {
    if (!this._event) {
      this._event = createEventApiClient(this.adapter);
    }
    return this._event;
  }

  get eventComments(): EventCommentsApiClient {
    if (!this._eventComments) {
      this._eventComments = createEventCommentsApiClient(this.adapter);
    }
    return this._eventComments;
  }

  get field(): FieldApiClient {
    if (!this._field) {
      this._field = createFieldApiClient(this.adapter);
    }
    return this._field;
  }

  get finance(): FinanceApiClient {
    if (!this._finance) {
      this._finance = createFinanceApiClient(this.adapter);
    }
    return this._finance;
  }

  get followers(): FollowersApiClient {
    if (!this._followers) {
      this._followers = createFollowersApiClient(this.adapter);
    }
    return this._followers;
  }

  get genericAction(): GenericActionApiClient {
    if (!this._genericAction) {
      this._genericAction = createGenericActionApiClient(this.adapter);
    }
    return this._genericAction;
  }

  get helpcenter(): HelpcenterApiClient {
    if (!this._helpcenter) {
      this._helpcenter = createHelpcenterApiClient(this.adapter);
    }
    return this._helpcenter;
  }

  get helpcenterGroups(): HelpcenterGroupsApiClient {
    if (!this._helpcenterGroups) {
      this._helpcenterGroups = createHelpcenterGroupsApiClient(this.adapter);
    }
    return this._helpcenterGroups;
  }

  get holidayList(): HolidayListApiClient {
    if (!this._holidayList) {
      this._holidayList = createHolidayListApiClient(this.adapter);
    }
    return this._holidayList;
  }

  get iMCannedMessage(): IMCannedMessageApiClient {
    if (!this._iMCannedMessage) {
      this._iMCannedMessage = createIMCannedMessageApiClient(this.adapter);
    }
    return this._iMCannedMessage;
  }

  get iMTemplateMessage(): IMTemplateMessageApiClient {
    if (!this._iMTemplateMessage) {
      this._iMTemplateMessage = createIMTemplateMessageApiClient(this.adapter);
    }
    return this._iMTemplateMessage;
  }

  get iM_Channel(): IM_ChannelApiClient {
    if (!this._iM_Channel) {
      this._iM_Channel = createIM_ChannelApiClient(this.adapter);
    }
    return this._iM_Channel;
  }

  get iM_Metrics(): IM_MetricsApiClient {
    if (!this._iM_Metrics) {
      this._iM_Metrics = createIM_MetricsApiClient(this.adapter);
    }
    return this._iM_Metrics;
  }

  get iM_Session(): IM_SessionApiClient {
    if (!this._iM_Session) {
      this._iM_Session = createIM_SessionApiClient(this.adapter);
    }
    return this._iM_Session;
  }

  get import(): ImportApiClient {
    if (!this._import) {
      this._import = createImportApiClient(this.adapter);
    }
    return this._import;
  }

  get kBRootCategory(): KBRootCategoryApiClient {
    if (!this._kBRootCategory) {
      this._kBRootCategory = createKBRootCategoryApiClient(this.adapter);
    }
    return this._kBRootCategory;
  }

  get kBSection(): KBSectionApiClient {
    if (!this._kBSection) {
      this._kBSection = createKBSectionApiClient(this.adapter);
    }
    return this._kBSection;
  }

  get kbCategory(): KbCategoryApiClient {
    if (!this._kbCategory) {
      this._kbCategory = createKbCategoryApiClient(this.adapter);
    }
    return this._kbCategory;
  }

  get kbCategoryLogo(): KbCategoryLogoApiClient {
    if (!this._kbCategoryLogo) {
      this._kbCategoryLogo = createKbCategoryLogoApiClient(this.adapter);
    }
    return this._kbCategoryLogo;
  }

  get label(): LabelApiClient {
    if (!this._label) {
      this._label = createLabelApiClient(this.adapter);
    }
    return this._label;
  }

  get layoutRuleCriteria(): LayoutRuleCriteriaApiClient {
    if (!this._layoutRuleCriteria) {
      this._layoutRuleCriteria = createLayoutRuleCriteriaApiClient(this.adapter);
    }
    return this._layoutRuleCriteria;
  }

  get layoutRules(): LayoutRulesApiClient {
    if (!this._layoutRules) {
      this._layoutRules = createLayoutRulesApiClient(this.adapter);
    }
    return this._layoutRules;
  }

  get licenseFeaturePlan(): LicenseFeaturePlanApiClient {
    if (!this._licenseFeaturePlan) {
      this._licenseFeaturePlan = createLicenseFeaturePlanApiClient(this.adapter);
    }
    return this._licenseFeaturePlan;
  }

  get mailReplyAddress(): MailReplyAddressApiClient {
    if (!this._mailReplyAddress) {
      this._mailReplyAddress = createMailReplyAddressApiClient(this.adapter);
    }
    return this._mailReplyAddress;
  }

  get module(): ModuleApiClient {
    if (!this._module) {
      this._module = createModuleApiClient(this.adapter);
    }
    return this._module;
  }

  get organization(): OrganizationApiClient {
    if (!this._organization) {
      this._organization = createOrganizationApiClient(this.adapter);
    }
    return this._organization;
  }

  get pendingApproval(): PendingApprovalApiClient {
    if (!this._pendingApproval) {
      this._pendingApproval = createPendingApprovalApiClient(this.adapter);
    }
    return this._pendingApproval;
  }

  get permalink(): PermalinkApiClient {
    if (!this._permalink) {
      this._permalink = createPermalinkApiClient(this.adapter);
    }
    return this._permalink;
  }

  get pinnedConversation(): PinnedConversationApiClient {
    if (!this._pinnedConversation) {
      this._pinnedConversation = createPinnedConversationApiClient(this.adapter);
    }
    return this._pinnedConversation;
  }

  get product(): ProductApiClient {
    if (!this._product) {
      this._product = createProductApiClient(this.adapter);
    }
    return this._product;
  }

  get productAttachment(): ProductAttachmentApiClient {
    if (!this._productAttachment) {
      this._productAttachment = createProductAttachmentApiClient(this.adapter);
    }
    return this._productAttachment;
  }

  get profile(): ProfileApiClient {
    if (!this._profile) {
      this._profile = createProfileApiClient(this.adapter);
    }
    return this._profile;
  }

  get recyclebin(): RecyclebinApiClient {
    if (!this._recyclebin) {
      this._recyclebin = createRecyclebinApiClient(this.adapter);
    }
    return this._recyclebin;
  }

  get reportIntegration(): ReportIntegrationApiClient {
    if (!this._reportIntegration) {
      this._reportIntegration = createReportIntegrationApiClient(this.adapter);
    }
    return this._reportIntegration;
  }

  get role(): RoleApiClient {
    if (!this._role) {
      this._role = createRoleApiClient(this.adapter);
    }
    return this._role;
  }

  get routingPreference(): RoutingPreferenceApiClient {
    if (!this._routingPreference) {
      this._routingPreference = createRoutingPreferenceApiClient(this.adapter);
    }
    return this._routingPreference;
  }

  get ruleGroup(): RuleGroupApiClient {
    if (!this._ruleGroup) {
      this._ruleGroup = createRuleGroupApiClient(this.adapter);
    }
    return this._ruleGroup;
  }

  get search(): SearchApiClient {
    if (!this._search) {
      this._search = createSearchApiClient(this.adapter);
    }
    return this._search;
  }

  get sharingRule(): SharingRuleApiClient {
    if (!this._sharingRule) {
      this._sharingRule = createSharingRuleApiClient(this.adapter);
    }
    return this._sharingRule;
  }

  get skill(): SkillApiClient {
    if (!this._skill) {
      this._skill = createSkillApiClient(this.adapter);
    }
    return this._skill;
  }

  get skillConfiguration(): SkillConfigurationApiClient {
    if (!this._skillConfiguration) {
      this._skillConfiguration = createSkillConfigurationApiClient(this.adapter);
    }
    return this._skillConfiguration;
  }

  get skillType(): SkillTypeApiClient {
    if (!this._skillType) {
      this._skillType = createSkillTypeApiClient(this.adapter);
    }
    return this._skillType;
  }

  get subjectAccessRequest(): SubjectAccessRequestApiClient {
    if (!this._subjectAccessRequest) {
      this._subjectAccessRequest = createSubjectAccessRequestApiClient(this.adapter);
    }
    return this._subjectAccessRequest;
  }

  get supportEmailDomain(): SupportEmailDomainApiClient {
    if (!this._supportEmailDomain) {
      this._supportEmailDomain = createSupportEmailDomainApiClient(this.adapter);
    }
    return this._supportEmailDomain;
  }

  get supportPlan(): SupportPlanApiClient {
    if (!this._supportPlan) {
      this._supportPlan = createSupportPlanApiClient(this.adapter);
    }
    return this._supportPlan;
  }

  get task(): TaskApiClient {
    if (!this._task) {
      this._task = createTaskApiClient(this.adapter);
    }
    return this._task;
  }

  get taskAttachment(): TaskAttachmentApiClient {
    if (!this._taskAttachment) {
      this._taskAttachment = createTaskAttachmentApiClient(this.adapter);
    }
    return this._taskAttachment;
  }

  get taskComments(): TaskCommentsApiClient {
    if (!this._taskComments) {
      this._taskComments = createTaskCommentsApiClient(this.adapter);
    }
    return this._taskComments;
  }

  get taskTimeEntry(): TaskTimeEntryApiClient {
    if (!this._taskTimeEntry) {
      this._taskTimeEntry = createTaskTimeEntryApiClient(this.adapter);
    }
    return this._taskTimeEntry;
  }

  get taskTimer(): TaskTimerApiClient {
    if (!this._taskTimer) {
      this._taskTimer = createTaskTimerApiClient(this.adapter);
    }
    return this._taskTimer;
  }

  get team(): TeamApiClient {
    if (!this._team) {
      this._team = createTeamApiClient(this.adapter);
    }
    return this._team;
  }

  get templateFolders(): TemplateFoldersApiClient {
    if (!this._templateFolders) {
      this._templateFolders = createTemplateFoldersApiClient(this.adapter);
    }
    return this._templateFolders;
  }

  get thread(): ThreadApiClient {
    if (!this._thread) {
      this._thread = createThreadApiClient(this.adapter);
    }
    return this._thread;
  }

  get ticket(): TicketApiClient {
    if (!this._ticket) {
      this._ticket = createTicketApiClient(this.adapter);
    }
    return this._ticket;
  }

  get ticketApprovals(): TicketApprovalsApiClient {
    if (!this._ticketApprovals) {
      this._ticketApprovals = createTicketApprovalsApiClient(this.adapter);
    }
    return this._ticketApprovals;
  }

  get ticketAttachment(): TicketAttachmentApiClient {
    if (!this._ticketAttachment) {
      this._ticketAttachment = createTicketAttachmentApiClient(this.adapter);
    }
    return this._ticketAttachment;
  }

  get ticketComment(): TicketCommentApiClient {
    if (!this._ticketComment) {
      this._ticketComment = createTicketCommentApiClient(this.adapter);
    }
    return this._ticketComment;
  }

  get ticketCount(): TicketCountApiClient {
    if (!this._ticketCount) {
      this._ticketCount = createTicketCountApiClient(this.adapter);
    }
    return this._ticketCount;
  }

  get ticketFollowers(): TicketFollowersApiClient {
    if (!this._ticketFollowers) {
      this._ticketFollowers = createTicketFollowersApiClient(this.adapter);
    }
    return this._ticketFollowers;
  }

  get ticketTag(): TicketTagApiClient {
    if (!this._ticketTag) {
      this._ticketTag = createTicketTagApiClient(this.adapter);
    }
    return this._ticketTag;
  }

  get ticketTemplate(): TicketTemplateApiClient {
    if (!this._ticketTemplate) {
      this._ticketTemplate = createTicketTemplateApiClient(this.adapter);
    }
    return this._ticketTemplate;
  }

  get ticketTimeEntry(): TicketTimeEntryApiClient {
    if (!this._ticketTimeEntry) {
      this._ticketTimeEntry = createTicketTimeEntryApiClient(this.adapter);
    }
    return this._ticketTimeEntry;
  }

  get ticketTimer(): TicketTimerApiClient {
    if (!this._ticketTimer) {
      this._ticketTimer = createTicketTimerApiClient(this.adapter);
    }
    return this._ticketTimer;
  }

  get timeTracking(): TimeTrackingApiClient {
    if (!this._timeTracking) {
      this._timeTracking = createTimeTrackingApiClient(this.adapter);
    }
    return this._timeTracking;
  }

  get upload(): UploadApiClient {
    if (!this._upload) {
      this._upload = createUploadApiClient(this.adapter);
    }
    return this._upload;
  }

  get user(): UserApiClient {
    if (!this._user) {
      this._user = createUserApiClient(this.adapter);
    }
    return this._user;
  }

  get validationRuleCriteria(): ValidationRuleCriteriaApiClient {
    if (!this._validationRuleCriteria) {
      this._validationRuleCriteria = createValidationRuleCriteriaApiClient(this.adapter);
    }
    return this._validationRuleCriteria;
  }

  get validationRules(): ValidationRulesApiClient {
    if (!this._validationRules) {
      this._validationRules = createValidationRulesApiClient(this.adapter);
    }
    return this._validationRules;
  }

  get webhook(): WebhookApiClient {
    if (!this._webhook) {
      this._webhook = createWebhookApiClient(this.adapter);
    }
    return this._webhook;
  }

  get widget(): WidgetApiClient {
    if (!this._widget) {
      this._widget = createWidgetApiClient(this.adapter);
    }
    return this._widget;
  }

}
