# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Fixed Raid event handler returning the raided display name instead of the raiding display name

### Changed
- The legacy events now have a `rawEvent` field, which will be the default on new ones
- Improved the disconnection flow

## [0.0.2] - 2024-05-13
### Added
- Graceful unsubscribe when quitting/redeploying
- Status string
### Changed 
- Twurple updated to `7.1.0` ([Changelog](https://github.com/twurple/twurple/releases/tag/v7.1.0))
- Logging through nodes instead of a direct `console.log`

## [0.0.1] - 2024-02-29
### Added
- First release
- "follow" event
- "subscribe" event
- "subscribeGift" event
- "bits" event
- "redeem" event
- "raid" event
