# Autonomous Campaign Adapter

`work-campaign.json` and `work-campaign-adapter.json` are inactive templates. Project init copies them but does not register, start, resume, or grant provider authority to a campaign.

Before selecting `--require campaign`:

1. Replace every `replace-me` argv entry with an explicit argument array owned by this project.
2. Set `scopeRoots`, exclusions, validation argv, checkpoint policy, effects, authorization refs, and finite budgets for one bounded outcome.
3. Keep state, evidence, and report paths project-contained and non-overlapping.
4. Leave `hostResume.enabled` false unless the protected Windows supervisor is separately previewed, installed, checked, and authorized.
5. Run `npm run doctor -- --project <project-root> --require campaign` from the kit. Doctor is read-only and does not activate the campaign.

Configured inference additionally requires `provider-inference` in `allowedEffects`, a non-secret `authorizationRefs.provider-inference`, a finite positive model-call budget, and the installed semantic executor. Never put credentials, prompts, arbitrary shell command strings, or remote-effect authority in either file.
