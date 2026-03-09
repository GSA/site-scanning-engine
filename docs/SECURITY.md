# Security

As part of a U.S. government agency, the General Services Administration
(GSA)'s [Technology Transformation Services (TTS)](https://gsa.gov/tts)
takes seriously our responsibility to protect the public's information,
including financial and personal information, from unwarranted
disclosure.

## Reporting security vulnerabilities

We want security researchers to feel comfortable reporting
vulnerabilities they've discovered, as set out in this policy,
so that we can fix them and keep our information safe.

This website follows TTS’s
[Vulnerability disclosure policy](https://github.com/18F/vulnerability-disclosure-policy/blob/master/vulnerability-disclosure-policy.md).

## Keeping dependencies up-to-date

The [Open Web Application Security Project (OWASP)](https://www.owasp.org/)
curates a list of the
[Top 10 Most Critical Web Application Security Risks](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project),
and
[Using Components with Known Vulnerabilities](https://www.owasp.org/index.php/Top_10-2017_A9-Using_Components_with_Known_Vulnerabilities)
has been on it the past seven years. We can, should, and must
keep our dependencies up-to-date.

### What you need to do

[GitHub’s automated security alerts](https://github.com/18F/cv_faq/security)
are enabled for this repository. All security alerts should be acted
upon **within two days**, as
[requested by the TTS Tech Portfolio](https://docs.google.com/document/d/1ajcxPViV_UyiUHTJQ8Qmi5-nVlvM-bXozqPY8HmMWxg/edit).

Acting means:

- Updating the dependency to resolve the security issue.
- Removing the vulnerable dependency or moving to a different
  comparable dependency to avoid the security issue.
- Dismissing the security alert with “Risk is tolerable
  to this project."
  - All security alerts dismissed in this way must be
    documented with a closed issue linking to the
    vulnerability and explaining why the risk is tolerable.
