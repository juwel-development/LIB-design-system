# Consumer acceptance verification

Adopting a published design-system release and checking whether a product's actual screens meet
that product's inventory and reference-window requirements belongs to the consuming application.
The design-system tracker does not carry those application verification tasks as library work.

## Why this is out of scope

The library owns its reusable component contracts, their implementation, and evidence that those
contracts hold. The consumer owns the application composition, data, wording, accepted inventory,
and acceptance measurements. Estimated residual deficits calculated from old application geometry
minus space recovered by a different library fixture do not establish a current library defect or
a missing reusable capability.

The maintainer made this ownership decision while triaging the five follow-ups required by #158.
That issue deliberately closed when its scoped compact spacing capability shipped; the follow-ups
preserved unverified consumer fit without making it a library release condition. They are now
closed upstream as consumer effort. Their evidence remains useful in their linked application
tickets, where the released capability should be adopted and measured against the real inventory.

This is a rejection of where the verification task lives, not of consumer-originated requests.
A consumer can return upstream with a reproducible component-contract violation or a demonstrated
need for a general capability, including its composition, current published dependency version,
measurements, supported alternatives tried, and the behavioral gap. Those requests receive their
own triage. The separate Dialog capability request #161 and Pane performance report #167 are not
rejected by this record.

## Prior requests

- [#162](https://github.com/juwel-development/LIB-design-system/issues/162) — Release planning
  remeasurement; consumer [#311](https://github.com/juwel-dev/g-label-manager/issues/311).
- [#163](https://github.com/juwel-development/LIB-design-system/issues/163) — Write a new song
  remeasurement; consumer [#314](https://github.com/juwel-dev/g-label-manager/issues/314).
- [#164](https://github.com/juwel-development/LIB-design-system/issues/164) — Market report
  remeasurement; consumer [#319](https://github.com/juwel-dev/g-label-manager/issues/319).
- [#165](https://github.com/juwel-development/LIB-design-system/issues/165) — Employment Negotiation
  remeasurement; consumer [#320](https://github.com/juwel-dev/g-label-manager/issues/320).
- [#166](https://github.com/juwel-development/LIB-design-system/issues/166) — Contract Negotiation
  remeasurement; consumer [#321](https://github.com/juwel-dev/g-label-manager/issues/321).
