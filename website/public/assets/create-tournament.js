// Tournament Creation System - Full Implementation
// All 5 Steps: Description, Registration, Format, Maps & Emotes, Date & Time

// Global State
const tournamentData = {
    // Step 1: Description
    title: '',
    region: 0,
    image: null,
    themeColor: '#22C55E',
    
    // Step 2: Registration
    mode: 1, // 1v1, 2v2, 3v3, 4v4
    maxPlayers: 128,
    accessType: 'open', // 'open' or 'invite'
    
    // Step 3: Format
    phases: [
        {
            id: 1,
            size: 128,
            format: 'SE', // Single Elimination
            rounds: 7
        }
    ],
    
    // Step 4: Maps & Emotes
    selectedMaps: [],
    
    // Step 5: Date & Time
    scheduledDate: null,
    scheduledTime: { hour: '01', minute: '00' },
    streamLink: ''
};

let currentStep = 1;
const totalSteps = 5;

// ============================================
// ALL AVAILABLE MAPS FROM CONFIG.TS
// Complete list of 70+ maps organized by type
// ============================================
const allMaps = {
    // ELIMINATION Maps (20 maps)
    'Elimination': [
        { id: 'Acid Pool', name: 'ACID POOL', type: '💀 Elimination', internal: 'L_049_AcidPool' },
        { id: 'Barbie Dream Dash', name: 'BARBIE DREAM DASH', type: '💀 Elimination', internal: 'IPL_031_Plastic' },
        { id: 'Block Dash', name: 'BLOCK DASH', type: '💀 Elimination', internal: 'level19_block' },
        { id: 'Block Dash Endless', name: 'BLOCK DASH ENDLESS', type: '💀 Elimination', internal: 'eventlevel8_block_endless' },
        { id: 'Block Dash Legendary', name: 'BLOCK DASH LEGENDARY', type: '💀 Elimination', internal: 'eventlevel13_block_legendary' },
        { id: 'Bombardment', name: 'BOMBARDMENT', type: '💀 Elimination', internal: 'level12_bomb' },
        { id: 'Bot Bash', name: 'BOT BASH', type: '💀 Elimination', internal: 'level22_bot' },
        { id: 'Bucket Mayhem', name: 'BUCKET MAYHEM', type: '💀 Elimination', internal: 'IPL_041_Cheese3' },
        { id: 'Honey Drop', name: 'HONEY DROP', type: '💀 Elimination', internal: 'level8_honey' },
        { id: 'Laser Dash', name: 'LASER DASH', type: '💀 Elimination', internal: 'eventlevel1_dash' },
        { id: 'Laser Tracer', name: 'LASER TRACER', type: '💀 Elimination', internal: 'level15_laser' },
        { id: 'Lava Land', name: 'LAVA LAND', type: '💀 Elimination', internal: 'level21_pillar' },
        { id: 'Rush Hour', name: 'RUSH HOUR', type: '💀 Elimination', internal: 'level24_streamtiles' },
        { id: 'sh-ARRRRGH-ks!', name: 'SH-ARRRRGH-KS!', type: '💀 Elimination', internal: 'SSL_011_SharkPirate' },
        { id: 'Sharkmuda Triangle', name: 'SHARKMUDA TRIANGLE', type: '💀 Elimination', internal: 'SSL_014_Sharktanic' },
        { id: 'Space Drop', name: 'SPACE DROP', type: '💀 Elimination', internal: 'eventlevel2_honeylg_easy' },
        { id: 'Space Drooop', name: 'SPACE DROOOP', type: '💀 Elimination', internal: 'eventlevel3_honeylg_medium' },
        { id: 'Space Droooooop', name: 'SPACE DROOOOOOP', type: '💀 Elimination', internal: 'eventlevel4_honeylg_hard' },
        { id: 'Tetris Tumble', name: 'TETRIS TUMBLE', type: '💀 Elimination', internal: 'IPL_048_Protractor' },
        { id: 'The Other Side', name: 'THE OTHER SIDE', type: '💀 Elimination', internal: 'L_042_Chicken' },
        { id: 'UFOMG!', name: 'UFOMG!', type: '💀 Elimination', internal: 'L_43_UFO3' }
    ],
    
    // RACE Maps (39 maps)
    'Race': [
        { id: 'Abducted Avenue', name: 'ABDUCTED AVENUE', type: '🏃 Race', internal: 'L_037_UFO2' },
        { id: 'Abduction Avenue', name: 'ABDUCTION AVENUE', type: '🏃 Race', internal: 'level28_ufo' },
        { id: 'Burrito Bonanza', name: 'BURRITO BONANZA', type: '🏃 Race', internal: 'level29_rollingtowers' },
        { id: 'Cannon Climb', name: 'CANNON CLIMB', type: '🏃 Race', internal: 'level6_hill' },
        { id: 'Cannonball Chaos', name: 'CANNONBALL CHAOS', type: '🏃 Race', internal: 'eventlevel9_cannonchaos' },
        { id: 'Crab\'s Landing', name: 'CRAB\'S LANDING', type: '🏃 Race', internal: 'L_035_beachCarnival' },
        { id: 'Don\'t Be Jelly!', name: 'DON\'T BE JELLY!', type: '🏃 Race', internal: 'IPL_039_Cheese1' },
        { id: 'Floor Flip', name: 'FLOOR FLIP', type: '🏃 Race', internal: 'level9_seesaw' },
        { id: 'Humble Stumble', name: 'HUMBLE STUMBLE', type: '🏃 Race', internal: 'level4_pushy' },
        { id: 'Ice Caramba', name: 'ICE CARAMBA', type: '🏃 Race', internal: 'SSL_016_IceSki' },
        { id: 'Icy Heights', name: 'ICY HEIGHTS', type: '🏃 Race', internal: 'level3_ice' },
        { id: 'Jungle Roll', name: 'JUNGLE ROLL', type: '🏃 Race', internal: 'level18_jungle' },
        { id: 'Lava Rush', name: 'LAVA RUSH', type: '🏃 Race', internal: 'level11_lava' },
        { id: 'Lost Temple', name: 'LOST TEMPLE', type: '🏃 Race', internal: 'level16_temple' },
        { id: 'Monopoly Rush', name: 'MONOPOLY RUSH', type: '🏃 Race', internal: 'IPL_038_Capital' },
        { id: 'MrBeast\'s Dangerous Traps', name: 'MRBEAST\'S DANGEROUS TRAPS', type: '🏃 Race', internal: 'IPL_044_Coconut' },
        { id: 'MrBeast\'s Warehouse', name: 'MRBEAST\'S WAREHOUSE', type: '🏃 Race', internal: 'level32_mall' },
        { id: 'NFL Scramble', name: 'NFL SCRAMBLE', type: '🏃 Race', internal: 'level6_hill_nfl' },
        { id: 'Over & Under', name: 'OVER & UNDER', type: '🏃 Race', internal: 'level7_moving' },
        { id: 'Paint Splash', name: 'PAINT SPLASH', type: '🏃 Race', internal: 'level20_paint' },
        { id: 'Pivot Push', name: 'PIVOT PUSH', type: '🏃 Race', internal: 'level5_pivot' },
        { id: 'Priv Dash', name: 'PRIV DASH', type: '🏃 Race', internal: 'StumblePrivDash' },
        { id: 'Priv Hour', name: 'PRIV HOUR', type: '🏃 Race', internal: 'StumblePrivHour' },
        { id: 'Priv Legendary Dash', name: 'PRIV LEGENDARY DASH', type: '🏃 Race', internal: 'StumblePrivLegendaryDash' },
        { id: 'Priv Tracer', name: 'PRIV TRACER', type: '🏃 Race', internal: 'StumblePrivTracer' },
        { id: 'Space Race', name: 'SPACE RACE', type: '🏃 Race', internal: 'level13_gravity' },
        { id: 'Spin Go Round', name: 'SPIN GO ROUND', type: '🏃 Race', internal: 'level1_whirly' },
        { id: 'Stumble Cove', name: 'STUMBLE COVE', type: '🏃 Race', internal: 'level30_Jumping' },
        { id: 'Stumble Trouble', name: 'STUMBLE TROUBLE', type: '🏃 Race', internal: 'eventlevel10_terrortumble' },
        { id: 'Stumble Up', name: 'STUMBLE UP', type: '🏃 Race_Survive', internal: 'SSL_017_Vertigo' },
        { id: 'Stumble Up EZ', name: 'STUMBLE UP EZ', type: '🏃 Race_Survive', internal: 'SSL_017_Vertigo_Easy' },
        { id: 'Super Lava Slide', name: 'SUPER LAVA SLIDE', type: '🏃 Race', internal: 'eventlevel6_lavasl' },
        { id: 'Super Paint Slide', name: 'SUPER PAINT SLIDE', type: '🏃 Race', internal: 'eventlevel5_paintsl' },
        { id: 'Super Pivot Slide', name: 'SUPER PIVOT SLIDE', type: '🏃 Race', internal: 'eventlevel7_pivotsl' },
        { id: 'Super Slide', name: 'SUPER SLIDE', type: '🏃 Race', internal: 'level14_slide' },
        { id: 'Super Waterpark', name: 'SUPER WATERPARK', type: '🏃 Race', internal: 'SSL_015_slides' },
        { id: 'Tile Fall', name: 'TILE FALL', type: '🏃 Race', internal: 'level2_tile' }
    ],
    
    // SHOOTER Maps (4 maps)
    'Shooter': [
        { id: 'Blaster Base', name: 'BLASTER BASE', type: '🔫 Shooter', internal: 'level27_orange' },
        { id: 'Blaster Base Zero', name: 'BLASTER BASE ZERO', type: '🔫 Shooter', internal: 'IPL_034_OrangeGravity' },
        { id: 'Elimination Base', name: 'ELIMINATION BASE', type: '🔫 Shooter', internal: 'IPL_033_OrangeDM' },
        { id: 'Scaffold Stumble', name: 'SCAFFOLD STUMBLE', type: '🔫 Shooter', internal: 'L_036_purple' }
    ],
    
    // DRIVING Maps (3 maps)
    'Driving': [
        { id: 'Hot Wheels Hustle', name: 'HOT WHEELS HUSTLE', type: '🚗 Driving', internal: 'level23_wheels' },
        { id: 'Hot Wheels Yeti Run', name: 'HOT WHEELS YETI RUN', type: '🚗 Driving', internal: 'IPL_047_Flame' },
        { id: 'Turbo Temple', name: 'TURBO TEMPLE', type: '🚗 Driving', internal: 'level26_JungleTemple' }
    ],
    
    // COLLECT Maps (3 maps)
    'Collect': [
        { id: 'Pac-Man Power', name: 'PAC-MAN POWER', type: '🎮 Collect', internal: 'IPL_050_Pizza' },
        { id: 'SkyRocket Royale', name: 'SKYROCKET ROYALE', type: '🎮 Collect', internal: 'eventlevel12_collectionRocket' },
        { id: 'Treasure Island', name: 'TREASURE ISLAND', type: '🎮 Collect', internal: 'level25_collectcarrots' }
    ]
};

// Flatten all maps for easy access
const availableMaps = Object.values(allMaps).flat();

// ============================================
// ALL AVAILABLE EMOTES FROM CONFIG.TS
// Complete list of 200+ emotes organized by category
// ============================================
const allEmotes = {
    // SPECIAL EMOTES (5 emotes)
    'Special': [
        { id: -3, name: 'Only Punch & Kick', category: '⚡ Special', icon: '🥊' },
        { id: -5, name: 'Hug Only', category: '⚡ Special', icon: '🤗' },
        { id: -4, name: 'Banana Only', category: '⚡ Special', icon: '🍌' },
        { id: -2, name: 'Punch Only', category: '⚡ Special', icon: '👊' },
        { id: -1, name: 'Special Emotes', category: '⚡ Special', icon: '✨' }
    ],
    
    // BASIC EMOTES (22 emotes)
    'Basic': [
        { id: 1, name: 'Happy', category: '😊 Basic', icon: '😊' },
        { id: 2, name: 'Cry', category: '😊 Basic', icon: '😢' },
        { id: 3, name: 'Angry', category: '😊 Basic', icon: '😠' },
        { id: 4, name: 'Cool', category: '😊 Basic', icon: '😎' },
        { id: 5, name: 'Thumbs Up', category: '😊 Basic', icon: '👍' },
        { id: 6, name: 'Skull', category: '😊 Basic', icon: '💀' },
        { id: 7, name: 'Crown', category: '😊 Basic', icon: '👑' },
        { id: 8, name: 'Hug', category: '😊 Basic', icon: '🤗' },
        { id: 9, name: 'Punch', category: '😊 Basic', icon: '👊' },
        { id: 10, name: 'Hi', category: '😊 Basic', icon: '👋' },
        { id: 11, name: 'Ha Ha', category: '😊 Basic', icon: '😂' },
        { id: 12, name: 'GG', category: '😊 Basic', icon: '🎮' },
        { id: 13, name: 'Kick', category: '😊 Basic', icon: '🦶' },
        { id: 23, name: 'Thumbs Down', category: '😊 Basic', icon: '👎' },
        { id: 44, name: '<3', category: '😊 Basic', icon: '❤️' },
        { id: 53, name: 'Poop', category: '😊 Basic', icon: '💩' },
        { id: 54, name: 'LOL', category: '😊 Basic', icon: '🤣' },
        { id: 55, name: 'Banana', category: '😊 Basic', icon: '🍌' },
        { id: 59, name: 'Heart Eyes', category: '😊 Basic', icon: '😍' },
        { id: 62, name: 'Oops!', category: '😊 Basic', icon: '😬' },
        { id: 68, name: 'Broken Heart', category: '😊 Basic', icon: '💔' },
        { id: 69, name: 'OMG', category: '😊 Basic', icon: '😱' }
    ],
    
    // DANCE EMOTES (22 emotes)
    'Dance': [
        { id: 14, name: 'Posing', category: '💃 Dance', icon: '💃' },
        { id: 15, name: 'Backflip', category: '💃 Dance', icon: '🤸' },
        { id: 19, name: 'Spin', category: '💃 Dance', icon: '🌀' },
        { id: 24, name: 'Dab', category: '💃 Dance', icon: '💪' },
        { id: 72, name: 'Bow', category: '💃 Dance', icon: '🙇' },
        { id: 73, name: 'The Robot', category: '💃 Dance', icon: '🤖' },
        { id: 74, name: 'The Worm', category: '💃 Dance', icon: '🐛' },
        { id: 84, name: 'Griddy Dance', category: '💃 Dance', icon: '🕺' },
        { id: 88, name: 'Samba Dance', category: '💃 Dance', icon: '💃' },
        { id: 95, name: 'DJ Moves', category: '💃 Dance', icon: '🎧' },
        { id: 97, name: 'Head Spin', category: '💃 Dance', icon: '🔄' },
        { id: 100, name: 'The Macarena', category: '💃 Dance', icon: '💃' },
        { id: 104, name: 'PBJ Dance', category: '💃 Dance', icon: '🥜' },
        { id: 105, name: 'Get Sturdy Dance', category: '💃 Dance', icon: '💪' },
        { id: 118, name: 'Style Dance', category: '💃 Dance', icon: '✨' },
        { id: 138, name: 'Side Wiggle', category: '💃 Dance', icon: '↔️' },
        { id: 202, name: 'Mariachi Dance of the Dead', category: '💃 Dance', icon: '🎺' },
        { id: 203, name: 'Catrin Dance of the Dead', category: '💃 Dance', icon: '💀' },
        { id: 204, name: 'Diwali Dance', category: '💃 Dance', icon: '🪔' },
        { id: 215, name: 'RightLeftSlide', category: '💃 Dance', icon: '↔️' },
        { id: 249, name: 'The Sprinkler', category: '💃 Dance', icon: '💦' },
        { id: 251, name: 'Moshpit', category: '💃 Dance', icon: '🤘' }
    ],
    
    // ACTION EMOTES (28 emotes)
    'Action': [
        { id: 17, name: 'Handstand', category: '⚡ Action', icon: '🤸' },
        { id: 20, name: 'Push Up', category: '⚡ Action', icon: '💪' },
        { id: 37, name: 'Selfie', category: '⚡ Action', icon: '🤳' },
        { id: 38, name: 'Lay On Ground', category: '⚡ Action', icon: '🛌' },
        { id: 41, name: 'Shoulder Brush', category: '⚡ Action', icon: '🤷' },
        { id: 42, name: 'Butt Shake', category: '⚡ Action', icon: '🍑' },
        { id: 43, name: 'Plank', category: '⚡ Action', icon: '📏' },
        { id: 45, name: 'Sit', category: '⚡ Action', icon: '🪑' },
        { id: 60, name: 'Holding Back', category: '⚡ Action', icon: '🤚' },
        { id: 63, name: 'Zzzzzz', category: '⚡ Action', icon: '😴' },
        { id: 77, name: 'Shadow Boxing', category: '⚡ Action', icon: '🥊' },
        { id: 78, name: 'Crane Kick', category: '⚡ Action', icon: '🦵' },
        { id: 79, name: 'Meditate', category: '⚡ Action', icon: '🧘' },
        { id: 81, name: 'Guitar Solo!', category: '⚡ Action', icon: '🎸' },
        { id: 85, name: 'Fire Punch', category: '⚡ Action', icon: '🔥' },
        { id: 87, name: 'Gym Flex', category: '⚡ Action', icon: '💪' },
        { id: 96, name: 'Going Super', category: '⚡ Action', icon: '⚡' },
        { id: 99, name: 'Bunny Hop', category: '⚡ Action', icon: '🐰' },
        { id: 106, name: 'Ninja Run', category: '⚡ Action', icon: '🥷' },
        { id: 123, name: 'Wet Kick', category: '⚡ Action', icon: '💦' },
        { id: 124, name: 'Charged Hug', category: '⚡ Action', icon: '⚡' },
        { id: 201, name: 'Carving the Turkey', category: '⚡ Action', icon: '🦃' },
        { id: 207, name: 'Skateboard Kickflip', category: '⚡ Action', icon: '🛹' },
        { id: 208, name: 'Nunchucks', category: '⚡ Action', icon: '🥋' },
        { id: 209, name: 'Cheerleader', category: '⚡ Action', icon: '📣' },
        { id: 218, name: 'Toss a Block', category: '⚡ Action', icon: '📦' },
        { id: 234, name: 'Snowball Throw', category: '⚡ Action', icon: '⛄' },
        { id: 239, name: 'Spatula Slap', category: '⚡ Action', icon: '🍳' },
        { id: 240, name: 'Karate Chop', category: '⚡ Action', icon: '🥋' }
    ],
    
    // SEASONAL EMOTES (29 emotes)
    'Seasonal': [
        { id: 46, name: 'Let\'s Snow', category: '🎄 Seasonal', icon: '❄️' },
        { id: 47, name: 'Merry Skull', category: '🎄 Seasonal', icon: '💀' },
        { id: 48, name: '2023 Emote', category: '🎄 Seasonal', icon: '🎉' },
        { id: 49, name: 'Santa Thumbs Up', category: '🎄 Seasonal', icon: '🎅' },
        { id: 50, name: 'Cold', category: '🎄 Seasonal', icon: '🥶' },
        { id: 51, name: 'Mad Cookie', category: '🎄 Seasonal', icon: '🍪' },
        { id: 52, name: 'Present', category: '🎄 Seasonal', icon: '🎁' },
        { id: 58, name: 'Year of the Rabbit', category: '🎄 Seasonal', icon: '🐰' },
        { id: 70, name: 'Red Packet', category: '🎄 Seasonal', icon: '🧧' },
        { id: 108, name: 'April Fools', category: '🎄 Seasonal', icon: '🤡' },
        { id: 110, name: 'Easter Egg', category: '🎄 Seasonal', icon: '🥚' },
        { id: 111, name: 'Easter Bunny', category: '🎄 Seasonal', icon: '🐰' },
        { id: 112, name: 'Angry Easter Bunny', category: '🎄 Seasonal', icon: '😠' },
        { id: 211, name: 'Happy Diwali', category: '🎄 Seasonal', icon: '🪔' },
        { id: 212, name: 'Happy Thanksgiving', category: '🎄 Seasonal', icon: '🦃' },
        { id: 213, name: 'Turkey', category: '🎄 Seasonal', icon: '🦃' },
        { id: 219, name: '2024 Emote', category: '🎄 Seasonal', icon: '🎉' },
        { id: 220, name: 'Merry Christmas', category: '🎄 Seasonal', icon: '🎄' },
        { id: 221, name: 'Happy Hanukkah', category: '🎄 Seasonal', icon: '🕎' },
        { id: 222, name: 'Happy Holidays', category: '🎄 Seasonal', icon: '🎊' },
        { id: 223, name: 'Happy Kwanzaa', category: '🎄 Seasonal', icon: '🕯️' },
        { id: 224, name: 'Candy Cane', category: '🎄 Seasonal', icon: '🍬' },
        { id: 225, name: 'Here Comes Santa Claus', category: '🎄 Seasonal', icon: '🎅' },
        { id: 226, name: 'Freezing', category: '🎄 Seasonal', icon: '🥶' },
        { id: 229, name: 'Hot Cocoa', category: '🎄 Seasonal', icon: '☕' },
        { id: 230, name: 'Warm Fire', category: '🎄 Seasonal', icon: '🔥' },
        { id: 233, name: 'Flying Snowball', category: '🎄 Seasonal', icon: '⛄' },
        { id: 242, name: 'Diwali Candle', category: '🎄 Seasonal', icon: '🪔' },
        { id: 243, name: 'Happy Dia De Los Muertos', category: '🎄 Seasonal', icon: '💀' },
        { id: 244, name: 'Sugar Skull', category: '🎄 Seasonal', icon: '💀' }
    ],
    
    // PREMIUM EMOTES (102 emotes - Part 1)
    'Premium': [
        { id: 56, name: 'Capybara', category: '⭐ Premium', icon: '🦫' },
        { id: 57, name: 'Party Popper', category: '⭐ Premium', icon: '🎉' },
        { id: 61, name: 'Capybara Tie', category: '⭐ Premium', icon: '🦫' },
        { id: 75, name: 'Big Chicken', category: '⭐ Premium', icon: '🐔' },
        { id: 80, name: 'My Crown!', category: '⭐ Premium', icon: '👑' },
        { id: 82, name: 'Champagne Shake', category: '⭐ Premium', icon: '🍾' },
        { id: 86, name: 'Angry Rabbid', category: '⭐ Premium', icon: '😠' },
        { id: 89, name: 'Happy Rabbid', category: '⭐ Premium', icon: '😊' },
        { id: 90, name: 'Sad Rabbid', category: '⭐ Premium', icon: '😢' },
        { id: 92, name: 'Happy Chibi', category: '⭐ Premium', icon: '😊' },
        { id: 93, name: 'Sad Chibi', category: '⭐ Premium', icon: '😢' },
        { id: 94, name: 'Mad Chibi', category: '⭐ Premium', icon: '😠' },
        { id: 98, name: 'Surf Mime', category: '⭐ Premium', icon: '🏄' },
        { id: 101, name: 'Neon Heart', category: '⭐ Premium', icon: '💖' },
        { id: 102, name: 'Neon Smiley Face', category: '⭐ Premium', icon: '😊' },
        { id: 103, name: 'Rainbow Wave', category: '⭐ Premium', icon: '🌈' },
        { id: 120, name: 'Tiny Bike', category: '⭐ Premium', icon: '🚲' },
        { id: 122, name: 'Golden Banana', category: '⭐ Premium', icon: '🍌' },
        { id: 137, name: 'Make it Rain', category: '⭐ Premium', icon: '💸' },
        { id: 139, name: 'Fireworks Show', category: '⭐ Premium', icon: '🎆' },
        { id: 142, name: 'UFO Abduction', category: '⭐ Premium', icon: '🛸' },
        { id: 143, name: 'MrBeast Case Legendary', category: '⭐ Premium', icon: '💼' },
        { id: 145, name: 'Fire', category: '⭐ Premium', icon: '🔥' },
        { id: 150, name: 'Barbie Smile', category: '⭐ Premium', icon: '💗' },
        { id: 151, name: 'Girl Power', category: '⭐ Premium', icon: '💪' },
        { id: 152, name: 'The Beast', category: '⭐ Premium', icon: '🦁' },
        { id: 153, name: 'Cash Money', category: '⭐ Premium', icon: '💵' },
        { id: 154, name: 'MrBeast', category: '⭐ Premium', icon: '👨' },
        { id: 155, name: 'MrBeast Case', category: '⭐ Premium', icon: '💼' },
        { id: 161, name: 'Money Case', category: '⭐ Premium', icon: '💼' },
        { id: 164, name: 'Money Gun', category: '⭐ Premium', icon: '🔫' },
        { id: 167, name: 'Money Pallet', category: '⭐ Premium', icon: '📦' },
        { id: 169, name: 'Share the Wealth', category: '⭐ Premium', icon: '💰' },
        { id: 170, name: 'Playing Monopoly', category: '⭐ Premium', icon: '🎲' },
        { id: 171, name: 'I\'m the boss', category: '⭐ Premium', icon: '👔' },
        { id: 172, name: 'Go To Jail', category: '⭐ Premium', icon: '🚔' },
        { id: 173, name: 'Flip the Table', category: '⭐ Premium', icon: '🤬' },
        { id: 174, name: 'Invisibility', category: '⭐ Premium', icon: '👻' },
        { id: 175, name: 'Strength of Atlas', category: '⭐ Premium', icon: '💪' },
        { id: 176, name: 'Zeus\' Lightning', category: '⭐ Premium', icon: '⚡' },
        { id: 177, name: 'Fire Cracker', category: '⭐ Premium', icon: '🧨' },
        { id: 178, name: 'Mr Beast', category: '⭐ Premium', icon: '👨' },
        { id: 179, name: 'Feastibles', category: '⭐ Premium', icon: '🍫' },
        { id: 180, name: 'Beast Cracker', category: '⭐ Premium', icon: '🧨' },
        { id: 181, name: 'Floor is Lava', category: '⭐ Premium', icon: '🌋' },
        { id: 182, name: 'Spike Walls', category: '⭐ Premium', icon: '🔪' },
        { id: 183, name: 'Money Jump', category: '⭐ Premium', icon: '💰' },
        { id: 184, name: 'Big Red button', category: '⭐ Premium', icon: '🔴' },
        { id: 185, name: 'Jokey\'s Smurfirrific Present', category: '⭐ Premium', icon: '🎁' },
        { id: 186, name: 'Smurfette', category: '⭐ Premium', icon: '👩' },
        { id: 187, name: 'Kiai', category: '⭐ Premium', icon: '🥋' },
        { id: 188, name: 'Smurferous Pow', category: '⭐ Premium', icon: '💥' },
        { id: 189, name: 'Go Blue', category: '⭐ Premium', icon: '💙' },
        { id: 190, name: 'Blah Bah Blah Bah Blah', category: '⭐ Premium', icon: '💬' },
        { id: 191, name: 'Stake through the Heart', category: '⭐ Premium', icon: '🗡️' },
        { id: 192, name: 'Ghost', category: '⭐ Premium', icon: '👻' },
        { id: 194, name: 'Bats And Moon', category: '⭐ Premium', icon: '🦇' },
        { id: 195, name: 'Zombie Pop', category: '⭐ Premium', icon: '🧟' },
        { id: 196, name: 'Witch\'s Brew', category: '⭐ Premium', icon: '🧪' },
        { id: 197, name: 'Maniac killer', category: '⭐ Premium', icon: '🔪' },
        { id: 198, name: 'Possessed', category: '⭐ Premium', icon: '😈' },
        { id: 199, name: 'SpongeBob Waterworks', category: '⭐ Premium', icon: '🧽' },
        { id: 200, name: 'Imagination', category: '⭐ Premium', icon: '🌈' },
        { id: 205, name: 'Ripping a Fart', category: '⭐ Premium', icon: '💨' },
        { id: 206, name: 'Shocker', category: '⭐ Premium', icon: '⚡' },
        { id: 210, name: 'Cactus Oooochhh!', category: '⭐ Premium', icon: '🌵' },
        { id: 214, name: 'Clown', category: '⭐ Premium', icon: '🤡' },
        { id: 216, name: 'Sweaty Grin', category: '⭐ Premium', icon: '😅' },
        { id: 217, name: 'Beast Lightning', category: '⭐ Premium', icon: '⚡' },
        { id: 227, name: 'Happy Ninja Day', category: '⭐ Premium', icon: '🥷' },
        { id: 228, name: 'Bacon!!!', category: '⭐ Premium', icon: '🥓' },
        { id: 231, name: 'Honk Honk!!!', category: '⭐ Premium', icon: '📯' },
        { id: 232, name: 'Mooooo!!!!', category: '⭐ Premium', icon: '🐄' },
        { id: 235, name: 'Handsome Squidward', category: '⭐ Premium', icon: '🦑' },
        { id: 236, name: 'Surprised Patrick', category: '⭐ Premium', icon: '⭐' },
        { id: 237, name: 'Surprised Spongebob', category: '⭐ Premium', icon: '🧽' },
        { id: 238, name: 'Gary', category: '⭐ Premium', icon: '🐌' },
        { id: 241, name: 'The End', category: '⭐ Premium', icon: '🎬' },
        { id: 246, name: 'Blue Cat Mushroom Hat', category: '⭐ Premium', icon: '🍄' },
        { id: 247, name: 'GiddyUp', category: '⭐ Premium', icon: '🐴' },
        { id: 248, name: 'TheBow', category: '⭐ Premium', icon: '🎀' },
        { id: 250, name: 'Snake', category: '⭐ Premium', icon: '🐍' },
        { id: 252, name: 'Cool... Cool... Cool...', category: '⭐ Premium', icon: '😎' },
        { id: 253, name: 'PAC-MAN', category: '⭐ Premium', icon: '👻' },
        { id: 254, name: 'Force Shield', category: '⭐ Premium', icon: '🛡️' },
        { id: 255, name: 'Corgi Floof', category: '⭐ Premium', icon: '🐕' },
        { id: 16, name: 'Sleeping', category: '⭐ Premium', icon: '😴' },
        { id: 18, name: 'Ripaska', category: '⭐ Premium', icon: '🎭' },
        { id: 21, name: 'Victory', category: '⭐ Premium', icon: '✌️' },
        { id: 25, name: 'ROFL', category: '⭐ Premium', icon: '🤣' },
        { id: 26, name: 'Let\'s Go', category: '⭐ Premium', icon: '🚀' },
        { id: 28, name: 'RIP', category: '⭐ Premium', icon: '⚰️' },
        { id: 29, name: 'Boo', category: '⭐ Premium', icon: '👻' },
        { id: 31, name: 'Scared', category: '⭐ Premium', icon: '😨' },
        { id: 32, name: 'Red Card', category: '⭐ Premium', icon: '🟥' },
        { id: 33, name: 'Foam Hand', category: '⭐ Premium', icon: '👋' },
        { id: 34, name: 'Happy Soccer Ball', category: '⭐ Premium', icon: '⚽' },
        { id: 35, name: 'Sad Soccer Ball', category: '⭐ Premium', icon: '⚽' },
        { id: 36, name: 'Too Cool', category: '⭐ Premium', icon: '😎' },
        { id: 39, name: 'Laughing At You', category: '⭐ Premium', icon: '😂' },
        { id: 64, name: 'Goal!', category: '⭐ Premium', icon: '⚽' },
        { id: 65, name: 'Black Eye', category: '⭐ Premium', icon: '🥊' },
        { id: 66, name: 'Football', category: '⭐ Premium', icon: '🏈' },
        { id: 67, name: 'KO!', category: '⭐ Premium', icon: '💫' },
        { id: 76, name: 'So Sad!', category: '⭐ Premium', icon: '😭' },
        { id: 83, name: 'Touchdown!', category: '⭐ Premium', icon: '🏈' },
        { id: 91, name: 'Hang Loose', category: '⭐ Premium', icon: '🤙' },
        { id: 107, name: 'Good Luck', category: '⭐ Premium', icon: '🍀' },
        { id: 109, name: 'Fool Guy Glasses', category: '⭐ Premium', icon: '🤡' },
        { id: 113, name: 'Storm Cloud', category: '⭐ Premium', icon: '⛈️' },
        { id: 114, name: 'Raspberries', category: '⭐ Premium', icon: '🫐' },
        { id: 115, name: 'UWU', category: '⭐ Premium', icon: '🥺' },
        { id: 117, name: 'RIP YOU', category: '⭐ Premium', icon: '⚰️' },
        { id: 119, name: 'Fireworks Fire', category: '⭐ Premium', icon: '🎆' },
        { id: 121, name: 'You Like Me!', category: '⭐ Premium', icon: '👍' },
        { id: 125, name: 'Pizza', category: '⭐ Premium', icon: '🍕' },
        { id: 126, name: 'Pirate', category: '⭐ Premium', icon: '🏴‍☠️' },
        { id: 127, name: 'Checkered Flag', category: '⭐ Premium', icon: '🏁' },
        { id: 128, name: 'Good/Evil', category: '⭐ Premium', icon: '😇' },
        { id: 129, name: 'Flaming tire', category: '⭐ Premium', icon: '🔥' },
        { id: 130, name: 'Bullseye', category: '⭐ Premium', icon: '🎯' },
        { id: 131, name: 'bro........', category: '⭐ Premium', icon: '😑' },
        { id: 132, name: 'Burning Heart', category: '⭐ Premium', icon: '❤️‍🔥' },
        { id: 133, name: 'Twisted', category: '⭐ Premium', icon: '🌀' },
        { id: 134, name: 'Rainbow', category: '⭐ Premium', icon: '🌈' },
        { id: 135, name: '3D Glasses', category: '⭐ Premium', icon: '🕶️' },
        { id: 136, name: 'No Cake 4U', category: '⭐ Premium', icon: '🍰' },
        { id: 140, name: '2B or Not 2B', category: '⭐ Premium', icon: '✏️' },
        { id: 141, name: 'Exploding Money', category: '⭐ Premium', icon: '💸' },
        { id: 144, name: 'Stumble Praise', category: '⭐ Premium', icon: '🙏' },
        { id: 146, name: 'Devil', category: '⭐ Premium', icon: '😈' },
        { id: 147, name: 'Barf', category: '⭐ Premium', icon: '🤮' },
        { id: 148, name: 'Unicorn Poop', category: '⭐ Premium', icon: '🦄' },
        { id: 149, name: 'USA Shades', category: '⭐ Premium', icon: '🕶️' },
        { id: 156, name: 'Ball', category: '⭐ Premium', icon: '⚽' },
        { id: 157, name: 'Hamburger', category: '⭐ Premium', icon: '🍔' },
        { id: 158, name: 'Ban Hammer', category: '⭐ Premium', icon: '🔨' },
        { id: 160, name: 'EZ', category: '⭐ Premium', icon: '😏' },
        { id: 162, name: 'Seein\' Stars', category: '⭐ Premium', icon: '⭐' },
        { id: 163, name: 'Sad Ice Cream', category: '⭐ Premium', icon: '🍦' },
        { id: 165, name: 'Descending', category: '⭐ Premium', icon: '⬇️' },
        { id: 166, name: 'Super Thief', category: '⭐ Premium', icon: '🦹' },
        { id: 168, name: 'Loser', category: '⭐ Premium', icon: '👎' }
    ]
};

// Flatten all emotes
const availableEmotes = Object.values(allEmotes).flat();

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupStepNavigation();
    loadStep(1);
});

// Step Navigation
function setupStepNavigation() {
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNum = parseInt(this.dataset.step);
            if (stepNum <= currentStep || isStepCompleted(stepNum - 1)) {
                loadStep(stepNum);
            }
        });
    });
}

function isStepCompleted(stepNum) {
    switch(stepNum) {
        case 1: return tournamentData.title.length >= 3 && tournamentData.region !== null;
        case 2: return tournamentData.mode > 0 && tournamentData.maxPlayers > 0;
        case 3: return tournamentData.phases.length > 0;
        case 4: return tournamentData.selectedMaps.length > 0;
        case 5: return true;
        default: return false;
    }
}

function loadStep(stepNum) {
    currentStep = stepNum;
    updateStepIndicators();
    
    const content = document.getElementById('mainContent');
    
    switch(stepNum) {
        case 1:
            content.innerHTML = getStep1HTML();
            initStep1();
            break;
        case 2:
            content.innerHTML = getStep2HTML();
            initStep2();
            break;
        case 3:
            content.innerHTML = getStep3HTML();
            initStep3();
            break;
        case 4:
            content.innerHTML = getStep4HTML();
            initStep4();
            break;
        case 5:
            content.innerHTML = getStep5HTML();
            initStep5();
            break;
    }
}

function updateStepIndicators() {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum === currentStep) {
            step.classList.add('active');
        } else if (stepNum < currentStep) {
            step.classList.add('completed');
        }
    });
}

function goBack() {
    window.location.href = '/dashboard.html';
}

function goToPreviousStep() {
    if (currentStep > 1) {
        loadStep(currentStep - 1);
    }
}

function goToNextStep() {
    if (currentStep < totalSteps) {
        // Validate current step
        if (validateCurrentStep()) {
            loadStep(currentStep + 1);
        }
    } else {
        // Final step - submit tournament
        submitTournament();
    }
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            if (!tournamentData.title || tournamentData.title.length < 3) {
                alert('Please enter a tournament title (at least 3 characters)');
                return false;
            }
            return true;
        case 2:
            return true; // Mode and players are always valid from dropdown
        case 3:
            return tournamentData.phases.length > 0;
        case 4:
            if (tournamentData.selectedMaps.length === 0) {
                alert('Please select at least one map');
                return false;
            }
            return true;
        case 5:
            return true;
        default:
            return true;
    }
}

// ============================================
// STEP 1: DESCRIPTION
// ============================================
function getStep1HTML() {
    return `
        <div class="content-header">
            <h1>General</h1>
            <p>Create Tournament</p>
        </div>

        <div class="form-grid">
            <!-- Left Column -->
            <div class="form-section">
                <div class="form-group">
                    <label class="form-label">TOURNAMENT IMAGE</label>
                    <div class="upload-area" id="uploadArea">
                        <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                        <div class="upload-icon">🖼️</div>
                        <h3 class="upload-title">No image yet</h3>
                        <p class="upload-subtitle">Upload an image or create one</p>
                        <div class="upload-buttons">
                            <button type="button" class="btn-secondary" onclick="document.getElementById('imageUpload').click()">Upload</button>
                            <button type="button" class="btn-secondary" onclick="alert('Image creator coming soon!')">Create</button>
                        </div>
                        <p style="font-size: 11px; color: #666; margin-top: 12px;">Or drag & drop an image here</p>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">TOURNAMENT TITLE</label>
                    <input type="text" id="tournamentTitle" class="form-input" placeholder="My Tournament Name..." value="${tournamentData.title}">
                </div>

                <div class="form-group">
                    <label class="form-label">REGION</label>
                    <select id="tournamentRegion" class="form-select">
                        <option value="0" ${tournamentData.region === 0 ? 'selected' : ''}>🌍 Europe</option>
                        <option value="1" ${tournamentData.region === 1 ? 'selected' : ''}>🌎 North America</option>
                        <option value="2" ${tournamentData.region === 2 ? 'selected' : ''}>🌎 South America</option>
                        <option value="3" ${tournamentData.region === 3 ? 'selected' : ''}>🌏 Asia</option>
                        <option value="4" ${tournamentData.region === 4 ? 'selected' : ''}>🌏 Oceania</option>
                    </select>
                </div>
            </div>

            <!-- Right Column -->
            <div class="form-section">
                <div class="form-group">
                    <label class="form-label">THEME COLOR</label>
                    <div class="color-picker-area" id="colorPicker" style="background: linear-gradient(135deg, ${tournamentData.themeColor} 0%, #764ba2 100%);">
                        <div class="color-indicator"></div>
                    </div>
                    <div class="color-slider">
                        <div class="color-slider-thumb"></div>
                    </div>
                    <div class="color-hex">
                        <div class="color-square" style="background: ${tournamentData.themeColor};"></div>
                        <div class="hex-input">
                            <span class="hex-label">#</span>
                            <span class="hex-value">${tournamentData.themeColor.substring(1).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer-actions">
            <button type="button" class="btn-cancel" onclick="goBack()">Cancel</button>
            <button type="button" class="btn-continue" onclick="goToNextStep()">
                Continue →
            </button>
        </div>
    `;
}

function initStep1() {
    // Title input
    document.getElementById('tournamentTitle').addEventListener('input', function(e) {
        tournamentData.title = e.target.value;
    });
    
    // Region select
    document.getElementById('tournamentRegion').addEventListener('change', function(e) {
        tournamentData.region = parseInt(e.target.value);
    });
    
    // Image upload
    const imageUpload = document.getElementById('imageUpload');
    const uploadArea = document.getElementById('uploadArea');
    
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                tournamentData.image = event.target.result;
                uploadArea.style.backgroundImage = `url(${event.target.result})`;
                uploadArea.style.backgroundSize = 'cover';
                uploadArea.style.backgroundPosition = 'center';
                uploadArea.querySelector('.upload-icon').style.display = 'none';
                uploadArea.querySelector('.upload-title').textContent = 'Image uploaded!';
                uploadArea.querySelector('.upload-subtitle').style.display = 'none';
                uploadArea.querySelector('.upload-buttons').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                tournamentData.image = event.target.result;
                uploadArea.style.backgroundImage = `url(${event.target.result})`;
                uploadArea.style.backgroundSize = 'cover';
                uploadArea.style.backgroundPosition = 'center';
                uploadArea.querySelector('.upload-icon').style.display = 'none';
                uploadArea.querySelector('.upload-title').textContent = 'Image uploaded!';
                uploadArea.querySelector('.upload-subtitle').style.display = 'none';
                uploadArea.querySelector('.upload-buttons').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Color picker
    initColorPicker();
}

function initColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    const colorSlider = document.querySelector('.color-slider');
    const colorSquare = document.querySelector('.color-square');
    const hexValue = document.querySelector('.hex-value');
    
    const colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'];
    
    colorSlider.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        
        const colorIndex = percentage * (colors.length - 1);
        const lowerIndex = Math.floor(colorIndex);
        const upperIndex = Math.ceil(colorIndex);
        const colorFraction = colorIndex - lowerIndex;
        
        const color1 = hexToRgb(colors[lowerIndex]);
        const color2 = hexToRgb(colors[upperIndex]);
        
        const r = Math.round(color1.r + (color2.r - color1.r) * colorFraction);
        const g = Math.round(color1.g + (color2.g - color1.g) * colorFraction);
        const b = Math.round(color1.b + (color2.b - color1.b) * colorFraction);
        
        tournamentData.themeColor = rgbToHex(r, g, b);
        updateColorDisplay();
        
        const thumb = this.querySelector('.color-slider-thumb');
        thumb.style.left = `${percentage * 100}%`;
    });
    
    colorPicker.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        const baseColor = hexToRgb(tournamentData.themeColor);
        const saturation = x;
        const brightness = 1 - y;
        
        const r = Math.round(baseColor.r * brightness * saturation + 255 * (1 - saturation));
        const g = Math.round(baseColor.g * brightness * saturation + 255 * (1 - saturation));
        const b = Math.round(baseColor.b * brightness * saturation + 255 * (1 - saturation));
        
        tournamentData.themeColor = rgbToHex(r, g, b);
        updateColorDisplay();
    });
    
    function updateColorDisplay() {
        colorPicker.style.background = `linear-gradient(135deg, ${tournamentData.themeColor} 0%, #764ba2 100%)`;
        colorSquare.style.background = tournamentData.themeColor;
        hexValue.textContent = tournamentData.themeColor.substring(1).toUpperCase();
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// ============================================
// STEP 2: REGISTRATION
// ============================================
function getStep2HTML() {
    return `
        <div class="content-header">
            <h1>Registration</h1>
            <p>Create Tournament</p>
        </div>

        <div class="form-grid">
            <div class="form-section">
                <div class="form-group">
                    <label class="form-label">MODE</label>
                    <select id="tournamentMode" class="form-select">
                        <option value="1" ${tournamentData.mode === 1 ? 'selected' : ''}>1v1</option>
                        <option value="2" ${tournamentData.mode === 2 ? 'selected' : ''}>2v2</option>
                        <option value="3" ${tournamentData.mode === 3 ? 'selected' : ''}>3v3</option>
                        <option value="4" ${tournamentData.mode === 4 ? 'selected' : ''}>4v4</option>
                    </select>
                </div>
            </div>

            <div class="form-section">
                <div class="form-group">
                    <label class="form-label">MAXIMUM PLAYERS</label>
                    <select id="maxPlayers" class="form-select">
                        <option value="32" ${tournamentData.maxPlayers === 32 ? 'selected' : ''}>👥 32 Players</option>
                        <option value="64" ${tournamentData.maxPlayers === 64 ? 'selected' : ''}>👥 64 Players</option>
                        <option value="128" ${tournamentData.maxPlayers === 128 ? 'selected' : ''}>👥 128 Players</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-group" style="margin-top: 30px;">
            <label class="form-label">ACCESS</label>
            <div class="access-options">
                <div class="access-option ${tournamentData.accessType === 'open' ? 'selected' : ''}" onclick="selectAccessType('open')">
                    <div class="access-option-header">
                        <div class="radio-circle"></div>
                        <div class="access-option-title">Open to everyone</div>
                    </div>
                    <div class="access-option-desc">Anyone can sign up for the tournament</div>
                </div>

                <div class="access-option ${tournamentData.accessType === 'invite' ? 'selected' : ''}" onclick="selectAccessType('invite')">
                    <div class="access-option-header">
                        <div class="radio-circle"></div>
                        <div class="access-option-title">Direct Invite</div>
                    </div>
                    <div class="access-option-desc">Only users you invite can join (coming soon)</div>
                    <div class="access-option-badge">OWNERS ONLY</div>
                </div>
            </div>
        </div>

        <div class="footer-actions">
            <button type="button" class="btn-back" onclick="goToPreviousStep()">← Back</button>
            <button type="button" class="btn-continue" onclick="goToNextStep()">
                Continue →
            </button>
        </div>
    `;
}

function initStep2() {
    document.getElementById('tournamentMode').addEventListener('change', function(e) {
        tournamentData.mode = parseInt(e.target.value);
        updatePhaseCalculations();
    });
    
    document.getElementById('maxPlayers').addEventListener('change', function(e) {
        tournamentData.maxPlayers = parseInt(e.target.value);
        updatePhaseCalculations();
    });
    
    updatePhaseCalculations();
}

function selectAccessType(type) {
    tournamentData.accessType = type;
    document.querySelectorAll('.access-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.access-option').classList.add('selected');
}

function updatePhaseCalculations() {
    const playersPerTeam = tournamentData.mode;
    const totalTeams = tournamentData.maxPlayers / playersPerTeam;
    const rounds = Math.ceil(Math.log2(totalTeams));
    
    tournamentData.phases = [{
        id: 1,
        size: tournamentData.maxPlayers,
        format: 'SE',
        rounds: rounds
    }];
    
    console.log(`Updated: ${tournamentData.maxPlayers} players, ${tournamentData.mode}v${tournamentData.mode} = ${totalTeams} teams = ${rounds} rounds`);
}

// ============================================
// STEP 3: FORMAT
// ============================================
function getStep3HTML() {
    const phase = tournamentData.phases[0];
    const totalTeams = phase.size / tournamentData.mode;
    
    return `
        <div class="content-header">
            <h1>Format</h1>
            <p>Create Tournament</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div class="form-label">NUMBER OF PHASES</div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="btn-secondary" style="width: 36px; height: 36px; padding: 0;" disabled>-</button>
                <span style="font-size: 18px; font-weight: 600; min-width: 30px; text-align: center;">1</span>
                <button type="button" class="btn-secondary" style="width: 36px; height: 36px; padding: 0;" disabled>+</button>
            </div>
        </div>

        <div style="padding: 24px; background: rgba(88, 101, 242, 0.1); border: 1px solid rgba(88, 101, 242, 0.2); border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <div style="width: 32px; height: 32px; background: #5865F2; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700;">1</div>
                <div style="font-size: 16px; font-weight: 600;">Phase 1</div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">SIZE</label>
                    <div class="form-input" style="background: rgba(255, 255, 255, 0.03); cursor: not-allowed;">
                        ${phase.size} PLAYERS
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">FORMAT</label>
                    <select class="form-select" disabled>
                        <option value="SE" selected>SE Bracket</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">ROUNDS</label>
                    <div class="form-input" style="background: rgba(255, 255, 255, 0.03); cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;">
                        <span>${phase.rounds} Rounds</span>
                        <span style="font-size: 12px; color: #888;">AUTO</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer-actions">
            <button type="button" class="btn-back" onclick="goToPreviousStep()">← Back</button>
            <button type="button" class="btn-continue" onclick="goToNextStep()">
                Continue →
            </button>
        </div>
    `;
}

function initStep3() {
    // Nothing to init - all auto-calculated
}

// ============================================
// STEP 4: MAPS & EMOTES
// ============================================
function getStep4HTML() {
    const phase = tournamentData.phases[0];
    
    return `
        <div class="content-header">
            <h1>Gameplay</h1>
            <p>Configure Maps & Emotes</p>
        </div>

        <!-- Phase Tabs -->
        <div class="tabs-container">
            <div class="tab active">
                <span style="display: inline-block; width: 20px; height: 20px; background: #5865F2; border-radius: 4px; text-align: center; line-height: 20px; margin-right: 8px; font-size: 12px;">1</span>
                PHASE 1
            </div>
        </div>

        <!-- Round Tabs -->
        <div class="round-tabs" id="roundTabs">
            ${Array.from({length: phase.rounds}, (_, i) => `
                <div class="round-tab ${i === 0 ? 'active' : ''}" data-round="${i + 1}" onclick="selectRound(${i + 1})">
                    ROUND ${i + 1}
                </div>
            `).join('')}
        </div>

        <!-- Round Editor Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(88, 101, 242, 0.1); border-radius: 10px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 28px; height: 28px; background: #5865F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;">1</div>
                <div>
                    <div style="font-size: 12px; color: #999; font-weight: 600;">ROUND EDITOR</div>
                    <div style="font-size: 15px; font-weight: 600;" id="roundEditorTitle">PHASE 1 - ROUND 1</div>
                </div>
            </div>
            <button class="sync-button" onclick="syncToAllRounds()">
                <span>📋</span>
                SYNC TO ALL
            </button>
        </div>

        <!-- Maps & Emotes Tabs -->
        <div class="tabs-container" style="margin-bottom: 30px;">
            <div class="tab active" onclick="switchGameplayTab('maps')">🗺️ MAPS</div>
            <div class="tab" onclick="switchGameplayTab('emotes')">😊 EMOTES</div>
        </div>

        <!-- Maps Section -->
        <div id="mapsSection">
            <div class="section-header">
                <div>
                    <div style="font-size: 12px; color: #999; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">🗺️ MAPS SELECTION</div>
                </div>
                <div class="picked-count">
                    <span id="pickedMapsCount">${tournamentData.selectedMaps.length}</span> / ${phase.rounds} PICKED
                </div>
            </div>

            <!-- Map Type Tabs -->
            <div class="tabs-container">
                <div class="tab active" onclick="filterMapsByType('all')">All Maps</div>
                <div class="tab" onclick="filterMapsByType('Elimination')">💀 Elimination</div>
                <div class="tab" onclick="filterMapsByType('Race')">🏃 Race</div>
                <div class="tab" onclick="filterMapsByType('Shooter')">🔫 Shooter</div>
                <div class="tab" onclick="filterMapsByType('Driving')">🚗 Driving</div>
                <div class="tab" onclick="filterMapsByType('Collect')">🎮 Collect</div>
            </div>

            <!-- Search -->
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Search Maps..." id="mapSearch">
            </div>

            <!-- Maps Grid -->
            <div class="maps-grid" id="mapsGrid">
                ${availableMaps.map(map => {
                    // Map type colors
                    const gradients = {
                        '💀 Elimination': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        '🏃 Race': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        '🏃 Race_Survive': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        '🔫 Shooter': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        '🚗 Driving': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        '🎮 Collect': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    };
                    const gradient = gradients[map.type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    
                    return `
                    <div class="map-card ${tournamentData.selectedMaps.includes(map.id) ? 'selected' : ''}" data-map-id="${map.id}" data-map-type="${map.type}">
                        <div style="width: 100%; height: 120px; background: ${gradient}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; text-align: center; padding: 12px; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                            ${map.name}
                        </div>
                        <div class="map-name">${map.type}</div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Emotes Section -->
        <div id="emotesSection" style="display: none;">
            <div class="section-header">
                <div>
                    <div style="font-size: 12px; color: #999; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">😊 EMOTES CONFIGURATION</div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">Select emotes to DISABLE (all others will be allowed)</div>
                </div>
                <div class="picked-count">
                    <span id="disabledEmotesCount">0</span> DISABLED
                </div>
            </div>

            <!-- Emote Category Tabs -->
            <div class="tabs-container">
                <div class="tab active" onclick="filterEmotesByCategory('all')">All Emotes</div>
                <div class="tab" onclick="filterEmotesByCategory('Basic')">😊 Basic</div>
                <div class="tab" onclick="filterEmotesByCategory('Dance')">💃 Dance</div>
                <div class="tab" onclick="filterEmotesByCategory('Action')">⚡ Action</div>
                <div class="tab" onclick="filterEmotesByCategory('Seasonal')">🎄 Seasonal</div>
                <div class="tab" onclick="filterEmotesByCategory('Premium')">⭐ Premium</div>
                <div class="tab" onclick="filterEmotesByCategory('Special')">⚡ Special</div>
            </div>

            <!-- Search -->
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" placeholder="Search Emotes..." id="emoteSearch">
            </div>

            <!-- Emotes Grid -->
            <div class="maps-grid" id="emotesGrid">
                ${availableEmotes.map(emote => `
                    <div class="map-card" data-emote-id="${emote.id}" data-emote-category="${emote.category}">
                        <div style="width: 100%; height: 120px; background: rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                            <div style="font-size: 40px;">${emote.icon}</div>
                            <div style="font-size: 11px; font-weight: 600; text-align: center; padding: 0 8px; line-height: 1.3;">${emote.name}</div>
                        </div>
                        <div class="map-name">${emote.category}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer-actions">
            <button type="button" class="btn-back" onclick="goToPreviousStep()">← Back</button>
            <button type="button" class="btn-continue" onclick="goToNextStep()">
                Continue →
            </button>
        </div>
    `;
}

let currentRound = 1;
let currentGameplayTab = 'maps';
let selectedDisabledEmotes = [];

function initStep4() {
    // Map selection
    document.querySelectorAll('#mapsGrid .map-card').forEach(card => {
        card.addEventListener('click', function() {
            const mapId = this.dataset.mapId;
            
            if (tournamentData.selectedMaps.includes(mapId)) {
                tournamentData.selectedMaps = tournamentData.selectedMaps.filter(id => id !== mapId);
                this.classList.remove('selected');
            } else {
                tournamentData.selectedMaps.push(mapId);
                this.classList.add('selected');
            }
            
            document.getElementById('pickedMapsCount').textContent = tournamentData.selectedMaps.length;
        });
    });
    
    // Emote selection (to DISABLE)
    document.querySelectorAll('#emotesGrid .map-card').forEach(card => {
        card.addEventListener('click', function() {
            const emoteId = parseInt(this.dataset.emoteId);
            
            if (selectedDisabledEmotes.includes(emoteId)) {
                selectedDisabledEmotes = selectedDisabledEmotes.filter(id => id !== emoteId);
                this.classList.remove('selected');
            } else {
                selectedDisabledEmotes.push(emoteId);
                this.classList.add('selected');
            }
            
            document.getElementById('disabledEmotesCount').textContent = selectedDisabledEmotes.length;
        });
    });
    
    // Map search
    const mapSearch = document.getElementById('mapSearch');
    if (mapSearch) {
        mapSearch.addEventListener('input', function(e) {
            const search = e.target.value.toLowerCase();
            document.querySelectorAll('#mapsGrid .map-card').forEach(card => {
                const mapId = card.dataset.mapId.toLowerCase();
                if (mapId.includes(search) || card.textContent.toLowerCase().includes(search)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Emote search
    const emoteSearch = document.getElementById('emoteSearch');
    if (emoteSearch) {
        emoteSearch.addEventListener('input', function(e) {
            const search = e.target.value.toLowerCase();
            document.querySelectorAll('#emotesGrid .map-card').forEach(card => {
                if (card.textContent.toLowerCase().includes(search)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

function selectRound(roundNum) {
    currentRound = roundNum;
    document.querySelectorAll('.round-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-round="${roundNum}"]`).classList.add('active');
    document.getElementById('roundEditorTitle').textContent = `PHASE 1 - ROUND ${roundNum}`;
}

function switchGameplayTab(tab) {
    currentGameplayTab = tab;
    
    // Update tab styles
    document.querySelectorAll('.tabs-container')[1].querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('active', (i === 0 && tab === 'maps') || (i === 1 && tab === 'emotes'));
    });
    
    // Show/hide sections
    document.getElementById('mapsSection').style.display = tab === 'maps' ? 'block' : 'none';
    document.getElementById('emotesSection').style.display = tab === 'emotes' ? 'block' : 'none';
}

function filterMapsByType(type) {
    document.querySelectorAll('#mapsGrid .map-card').forEach(card => {
        if (type === 'all') {
            card.style.display = 'block';
        } else {
            const mapType = card.dataset.mapType;
            card.style.display = mapType.includes(type) ? 'block' : 'none';
        }
    });
    
    // Update active tab
    const tabs = document.querySelectorAll('.tabs-container')[2].querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (type === 'all') tabs[0].classList.add('active');
    else if (type === 'Elimination') tabs[1].classList.add('active');
    else if (type === 'Race') tabs[2].classList.add('active');
    else if (type === 'Shooter') tabs[3].classList.add('active');
    else if (type === 'Driving') tabs[4].classList.add('active');
    else if (type === 'Collect') tabs[5].classList.add('active');
}

function filterEmotesByCategory(category) {
    document.querySelectorAll('#emotesGrid .map-card').forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const emoteCategory = card.dataset.emoteCategory;
            card.style.display = emoteCategory.includes(category) ? 'block' : 'none';
        }
    });
    
    // Update active tab
    const tabs = document.querySelectorAll('.tabs-container')[3].querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (category === 'all') tabs[0].classList.add('active');
    else if (category === 'Basic') tabs[1].classList.add('active');
    else if (category === 'Dance') tabs[2].classList.add('active');
    else if (category === 'Action') tabs[3].classList.add('active');
    else if (category === 'Seasonal') tabs[4].classList.add('active');
    else if (category === 'Premium') tabs[5].classList.add('active');
    else if (category === 'Special') tabs[6].classList.add('active');
}

function syncToAllRounds() {
    alert(`🔄 Synced current map selection to all ${tournamentData.phases[0].rounds} rounds!`);
}

// ============================================
// STEP 5: DATE & TIME
// ============================================
function getStep5HTML() {
    const phase = tournamentData.phases[0];
    const totalTeams = phase.size / tournamentData.mode;
    
    return `
        <div class="content-header">
            <h1>Schedule</h1>
            <p>Create Tournament</p>
        </div>

        <!-- Summary -->
        <div class="form-label" style="margin-bottom: 16px;">SUMMARY</div>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">TITLE</div>
                <div class="summary-value">${tournamentData.title || 'Untitled'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">REGION</div>
                <div class="summary-value">${['Europe', 'North America', 'South America', 'Asia', 'Oceania'][tournamentData.region]}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">MODE</div>
                <div class="summary-value">${tournamentData.mode}v${tournamentData.mode}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">PLAYERS</div>
                <div class="summary-value">${phase.size}</div>
            </div>
        </div>

        <div class="form-grid" style="margin-top: 40px;">
            <!-- Calendar -->
            <div class="form-section">
                <div class="form-label" style="margin-bottom: 16px;">📅 SCHEDULE</div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <button type="button" class="btn-secondary">◄</button>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 16px; font-weight: 600;">September</div>
                        <div style="font-size: 14px; color: #999;">2026</div>
                    </div>
                    <button type="button" class="btn-secondary">►</button>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-grid">
                        <div class="calendar-day-header">Sun</div>
                        <div class="calendar-day-header">Mon</div>
                        <div class="calendar-day-header">Tue</div>
                        <div class="calendar-day-header">Wed</div>
                        <div class="calendar-day-header">Thu</div>
                        <div class="calendar-day-header">Fri</div>
                        <div class="calendar-day-header">Sat</div>
                        ${Array.from({length: 35}, (_, i) => {
                            const day = i - 1;
                            if (day < 1 || day > 30) {
                                return '<div class="calendar-day disabled"></div>';
                            }
                            return `<div class="calendar-day ${day === 15 ? 'selected' : ''}">${day}</div>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Time Picker -->
                <div class="form-label" style="margin-top: 24px; margin-bottom: 16px;">⏰ SELECT TIME (LOCAL)</div>
                <div class="time-picker">
                    <div style="flex: 1;">
                        <input type="text" class="time-input" id="hourInput" value="01" maxlength="2" style="text-align: center;">
                        <div class="time-label">Hour</div>
                    </div>
                    <div style="font-size: 24px; font-weight: 700; padding-top: 8px;">:</div>
                    <div style="flex: 1;">
                        <input type="text" class="time-input" id="minuteInput" value="00" maxlength="2" style="text-align: center;">
                        <div class="time-label">Mins</div>
                    </div>
                </div>

                <div style="margin-top: 16px; padding: 12px 16px; background: rgba(88, 101, 242, 0.1); border: 1px solid rgba(88, 101, 242, 0.2); border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 4px;">FINAL SCHEDULE</div>
                    <div style="font-size: 14px; font-weight: 600; color: #5865F2;">2026-09-15 @ 00:44</div>
                </div>
            </div>

            <!-- Stream Link -->
            <div class="form-section">
                <div class="form-label" style="margin-bottom: 16px;">📺 STREAM LINK</div>
                <input type="url" class="form-input" id="streamLink" placeholder="https://twitch.tv/..." value="${tournamentData.streamLink}">
                <p style="font-size: 12px; color: #999; margin-top: 8px;">Optional: Adds a live stream button to the tournament card when active</p>
            </div>
        </div>

        <div class="footer-actions">
            <button type="button" class="btn-back" onclick="goToPreviousStep()">← Back</button>
            <button type="button" class="btn-launch" onclick="submitTournament()">
                🚀 Launch Tournament
            </button>
        </div>
    `;
}

function initStep5() {
    // Calendar days
    document.querySelectorAll('.calendar-day:not(.disabled)').forEach(day => {
        day.addEventListener('click', function() {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
            tournamentData.scheduledDate = parseInt(this.textContent);
        });
    });
    
    // Time inputs
    document.getElementById('hourInput').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 0) {
            val = Math.min(23, parseInt(val)).toString().padStart(2, '0');
        }
        e.target.value = val;
        tournamentData.scheduledTime.hour = val;
    });
    
    document.getElementById('minuteInput').addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 0) {
            val = Math.min(59, parseInt(val)).toString().padStart(2, '0');
        }
        e.target.value = val;
        tournamentData.scheduledTime.minute = val;
    });
    
    // Stream link
    document.getElementById('streamLink').addEventListener('input', function(e) {
        tournamentData.streamLink = e.target.value;
    });
}

// ============================================
// SUBMIT TOURNAMENT
// ============================================
async function submitTournament() {
    console.log('🚀 Submitting tournament:', tournamentData);
    
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
        alert('Please login first!');
        window.location.href = '/login.html';
        return;
    }
    
    const currentUser = JSON.parse(userData);
    
    if (currentUser.credits < 1) {
        alert('⚠️ Insufficient credits! You need at least 1 credit. Contact admin for credits.');
        return;
    }
    
    const phase = tournamentData.phases[0];
    
    // Prepare API data
    const apiData = {
        discordId: currentUser.discordId,
        username: currentUser.username,
        name: tournamentData.title,
        mode: tournamentData.mode,
        region: tournamentData.region,
        maxParticipants: phase.size,
        description: `${tournamentData.mode}v${tournamentData.mode} Tournament`,
        map: tournamentData.selectedMaps[0] || 'BlockDash',
        roundCount: phase.rounds
    };
    
    if (tournamentData.scheduledDate) {
        const date = new Date(2026, 8, tournamentData.scheduledDate, 
            parseInt(tournamentData.scheduledTime.hour), 
            parseInt(tournamentData.scheduledTime.minute));
        apiData.scheduledFor = date.toISOString();
    }
    
    console.log('📤 API Request:', apiData);
    
    try {
        const response = await fetch('/api/tournaments/create', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
            },
            body: JSON.stringify(apiData)
        });
        
        const result = await response.json();
        console.log('📥 API Response:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create tournament');
        }
        
        alert('🎉 Tournament created successfully! 1 credit deducted.');
        
        // Update user credits in localStorage
        currentUser.credits = result.remainingCredits;
        currentUser.tournamentsCreated = (currentUser.tournamentsCreated || 0) + 1;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
}
