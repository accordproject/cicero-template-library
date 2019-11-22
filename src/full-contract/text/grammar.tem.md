{{%
import org.accordproject.servicelevelagreement.CompanyDetails from https://templates.accordproject.org/archives/company-details@0.1.0.cta
import org.accordproject.helloworld.* from https://templates.accordproject.org/archives/helloworld@0.12.0.cta
%}}

# Service level agreement (SLA)

{{#clause helloworld}}
Name of the person to greet: "Fred Blogs".
Thank you!
{{/clause}}

## Introduction
This service level agreement (SLA) describes the levels of service that {{clientName}} ('the client') will receive from `{{supplierName}}` ('the supplier').

This SLA should be read alongside the IT support contract between the client and the supplier. Although the SLA covers key areas of the client's IT systems and support, the support contract may include areas not covered by this SLA.

## Purpose
The client depends on IT equipment, software and services (together: 'the IT system') that are provided, maintained and supported by the supplier. Some of these items are of critical importance to the business.

This service level agreement sets out what levels of availability and support the client is guaranteed to receive for specific parts of the IT system. It also explains what penalties will be applied to the supplier should it fail to meet these levels.

This SLA forms an important part of the contract between the client and the supplier. It aims to enable the two parties to work together effectively.

## Scope

### Parties

This SLA is between:

The client:

{{>clientDetails}}

The supplier:

{{>supplierDetails}}

## Dates and reviews
This agreement begins on {{contractStart}} and will run for a period of {{contractMonths}} months.

It may be reviewed at any point, by mutual agreement. It may also be reviewed if there are any changes to the client's IT system.

## Equipment, software and services covered
This SLA covers only the equipment, software and services in the table below. This list may be updated at any time, with agreement from both the client and supplier.

Please note:

   * The supplier guarantees response times for all items listed in this section. 
   * The supplier guarantees uptime only for items with a tick in the Covered for uptime? column.
   * These items have been assigned a priority level, from 1 (most important) to 3 (least important). The priority levels help determine the guaranteed uptime and response time.


{{coverageItems}}

This SLA is written in a spirit of partnership. The supplier will always do everything possible to rectify every issue in a timely manner.

However, there are a few exclusions. This SLA does not apply to:

   * Any equipment, software, services or other parts of the IT system not listed above
   * Software, equipment or services not purchased via and managed by the supplier 

Additionally, this SLA does not apply when:

   * The problem has been caused by using equipment, software or service(s) in a way that is not recommended. 
   * The client has made unauthorised changes to the configuration or set up of affected equipment, software or services.
   * The client has prevented the supplier from performing required maintenance and update tasks. 
   * The issue has been caused by unsupported equipment, software or other services.
   * This SLA does not apply in circumstances that could be reasonably said to be beyond the supplier's control. For instance: floods, war, acts of god and so on.
   * This SLA also does not apply if the client is in breach of its contract with the supplier for any reason (e.g. late payment of fees).

Having said all that, {{supplierName}} aims to be helpful and accommodating at all times, and will do its absolute best to assist {{clientName}} wherever possible.

## Responsibilities
## Supplier responsibilities
The supplier will provide and maintain the IT system used by the client.

The IT support contract between the supplier and the client includes full details of these responsibilities.

Additionally, the supplier will:

   * Ensure relevant software, services and equipment are available to the client in line with the uptime levels listed below.
   * Respond to support requests within the timescales listed below.
   * Take steps to escalate and resolve issues in an appropriate, timely manner.
   * Maintain good communication with the client at all times.

## Client responsibilities
The client will use the supplier-provided IT system as intended.

The IT support contract between the supplier and the client includes full details of the IT system and its intended uses.

Additionally, the client will:

   * Notify the client of issues or problems in a timely manner.
   * Provide the supplier with access to equipment, software and services for the purposes of maintenance, updates and fault prevention.
   * Maintain good communication with the supplier at all times.

## Guaranteed uptime
### Uptime levels
In order to enable the client to do business effectively, the supplier guarantees that certain items will be available for a certain percentage of time.

These uptime levels apply to items in the Equipment, software and services covered table that show a tick in the Covered for uptime column.

The level of guaranteed uptime depends on the priority level of each item:

{{uptimeLevel}}

### Measurement and penalties
Uptime is measured the using supplier's automated systems, over each calendar month. It is calculated to the nearest minute, based on the number of minutes in the given month (for instance, a 31-day month contains 44,640 minutes).

If uptime for any item drops below the relevant threshold, a penalty will be applied in the form of a credit for the client.

This means the following month's fee payable by the client will be reduced on a sliding scale.

The level of penalty will be calculated depending on the number of hours for which the service was unavailable, minus the downtime permitted by the SLA:

Priority level

{{penalties}}

## Important notes:
Uptime penalties in any month are capped at {{penaltyCap}}% of the total monthly fee.

Uptime measurements exclude periods of routine maintenance. These must be agreed between the supplier and client in advance.

## Guaranteed response times
When the client raises a support issue with the supplier, the supplier promises to respond in a timely fashion.

## Response times
The response time measures how long it takes the supplier to respond to a support request raised via the supplier's online support system. 

The supplier is deemed to have responded when it has replied to the client's initial request. This may be in the form of an email or telephone call, to either provide a solution or request further information.

Guaranteed response times depend on the priority of the item(s) affected and the severity of the issue. They are shown in this table:

{{responseTimes}}

Response times are measured from the moment the client submits a support request via the supplier's online support system.

Response times apply during standard working hours (9am — 5.30pm) only, unless the contract between the client and supplier specifically includes provisions for out of hours support.

### Severity levels

The severity levels shown in the tables above are defined as follows:

   * Fatal: Complete degradation — all users and critical functions affected. Item or service completely unavailable.
   * Severe: Significant degradation — large number of users or critical functions affected.
   * Medium: Limited degradation — limited number of users or functions affected. Business processes can continue.
   * Minor: Small degradation — few users or one user affected. Business processes can continue. 

## Measurement and penalties
Response times are measured using the supplier's support ticketing system, which tracks all issues from initial reporting to resolution.

It is vital the client raises every issue via this system. If an issue is not raised in this way, the guaranteed response time does not apply to that issue.

If the supplier fails to meet a guaranteed response, a penalty will be applied in the form of a credit for the client.

This means the following month's fee payable by the client will be reduced on a sliding scale.

The level of penalty will be calculated depending on the number of hours by which the supplier missed the response time, minus the downtime permitted by the SLA:

{{priorityPenalty}}

Important notes:

   * Response time penalties in any month are capped at 50% of the total monthly fee.
   * Response times are measured during working hours (9am — 5.30pm). 
   * For instance, if an issue is reported at 5.00pm with a response time of 60 minutes, the supplier has until 9.30am the following day to respond.

## Resolution times
The supplier will always endeavour to resolve problems as swiftly as possible. It recognises that the client's computer systems are key to its business and that any downtime can cost money.

However, the supplier is unable to provide guaranteed resolution times. This is because the nature and causes of problems can vary enormously. 

For instance, it may be possible to resolve a fatal server issue in minutes, simply by restarting the server. But if a server fails due to disk error or a hardware fault (also classed as a fatal issue) it may take much longer to get back up and running.

In all cases, the supplier will make its best efforts to resolve problems as quickly as possible. It will also provide frequent progress reports to the client.

## Right of termination
The supplier recognises that it provides services that are critical to the client's business.

If the supplier consistently fails to meet the service levels described in this document, the client may terminate its entire contract with the supplier, with no penalty.

This right is available to the client if the supplier fails to meet these service levels more than five times in any single calendar month.

## Signatures
This service level agreement is agreed as part of the IT support contract between {{clientName}} and {{supplierName}}:

Signed on behalf of the client: 

{{clientSignature}}


Signed on behalf of the supplier: 

{{supplierSignature}}

