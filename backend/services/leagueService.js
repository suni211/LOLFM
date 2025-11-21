const pool = require('../database/pool');

class LeagueService {
  // 리그에 AI 팀 채우기
  static async fillLeagueWithAITeams(leagueId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 리그 정보 조회
      const [league] = await conn.query(
        'SELECT * FROM leagues WHERE id = ?',
        [leagueId]
      );
      
      if (!league) {
        throw new Error('리그를 찾을 수 없습니다.');
      }
      
      // 현재 팀 수 확인
      const teamCount = await conn.query(
        'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
        [leagueId]
      );
      
      // BigInt를 Number로 명시적 변환
      const currentTeams = Number(teamCount[0].count);
      const maxTeams = Number(league.max_teams);
      const neededTeams = maxTeams - currentTeams;
      
      if (neededTeams <= 0) {
        return { message: '리그가 이미 꽉 찼습니다.' };
      }
      
      // AI 팀 생성 - 다양한 팀명
      const aiTeamNames = [
        // 동물/자연 관련
        'Phoenix Rising', 'Dragon Warriors', 'Thunder Esports', 'Shadow Legends',
        'Titan Gaming', 'Viper Squad', 'Eagle Elite', 'Storm Riders',
        'Falcon Force', 'Wolf Pack', 'Lion Pride', 'Bear Clan',
        'Shark Attack', 'Tiger Strike', 'Panther Gaming', 'Cobra Team',
        'Falcon Knights', 'Dragon Lords', 'Thunder Bolts', 'Shadow Hunters',
        'Eagle Warriors', 'Wolf Warriors', 'Lion Kings', 'Bear Force',
        'Tiger Claws', 'Panther Elite', 'Cobra Strike', 'Shark Fin',
        // 게이밍/전투 관련
        'Blade Masters', 'Sword Saints', 'Axe Warriors', 'Spear Knights',
        'Bow Rangers', 'Shield Guardians', 'Arrow Snipers', 'Dagger Assassins',
        'Mace Crushers', 'Hammer Smashers', 'Crossbow Hunters', 'Whip Lashers',
        // 에너지/원소 관련
        'Fire Blaze', 'Ice Frost', 'Lightning Bolt', 'Wind Storm',
        'Earth Quake', 'Water Wave', 'Light Ray', 'Dark Shadow',
        'Thunder Strike', 'Flame Burst', 'Frost Bite', 'Storm Surge',
        // 전설/신화 관련
        'Legendary Heroes', 'Mythic Warriors', 'Epic Champions', 'Divine Guardians',
        'Ancient Kings', 'Royal Knights', 'Noble Lords', 'Supreme Masters',
        // 현대적 이름
        'Neon Lights', 'Cyber Strike', 'Digital Force', 'Quantum Leap',
        'Matrix Team', 'Pixel Warriors', 'Code Breakers', 'Data Storm',
        // 지역/국가 스타일
        'Northern Stars', 'Southern Winds', 'Eastern Dragons', 'Western Eagles',
        'Central Titans', 'Coastal Sharks', 'Mountain Lions', 'Desert Vipers'
      ];
      
      // 사용된 이름 추적 (중복 방지)
      const usedNames = new Set();
      
      for (let i = 0; i < neededTeams; i++) {
        let teamName;
        let attempts = 0;
        
        // 중복되지 않는 이름 찾기
        do {
          const baseName = aiTeamNames[Math.floor(Math.random() * aiTeamNames.length)];
          const suffix = Math.floor(Math.random() * 1000); // 0-999 랜덤 숫자
          teamName = `${baseName} ${suffix}`;
          attempts++;
        } while (usedNames.has(teamName) && attempts < 100);
        
        usedNames.add(teamName);
        const abbreviation = teamName.split(' ').map(w => w[0]).join('').substring(0, 5).toUpperCase();
        
        // AI 팀 생성
        const result = await conn.query(
          `INSERT INTO teams (user_id, region_id, league_id, name, abbreviation, money, is_ai)
           VALUES (NULL, ?, ?, ?, ?, 100000000, TRUE)`,
          [league.region_id, leagueId, teamName, abbreviation]
        );
        
        const aiTeamId = result.insertId;
        
        // AI 팀 기본 시설 생성
        try {
          // 경기장 생성 (레벨 1)
          await conn.query(
            `INSERT INTO stadiums (team_id, level, name, max_capacity, monthly_maintenance_cost)
             VALUES (?, 1, '기본 아레나', 100, 1000000)`,
            [aiTeamId]
          );
          
          // 숙소 생성 (레벨 1)
          const conditionBonus = 10 + Math.floor(Math.random() * 21); // 10~30
          const growthBonus = Math.floor(conditionBonus / 2);
          await conn.query(
            `INSERT INTO dormitories (team_id, level, condition_bonus, growth_bonus, monthly_maintenance_cost)
             VALUES (?, 1, ?, ?, 500000)`,
            [aiTeamId, conditionBonus, growthBonus]
          );
          
          // 훈련장 생성 (레벨 1)
          await conn.query(
            `INSERT INTO training_facilities (team_id, level, growth_bonus, monthly_maintenance_cost)
             VALUES (?, 1, 5.0, 1000000)`,
            [aiTeamId]
          );
          
          // 의료실 생성 (레벨 1)
          await conn.query(
            `INSERT INTO medical_rooms (team_id, level, recovery_speed_bonus, condition_recovery_bonus, monthly_maintenance_cost)
             VALUES (?, 1, 3.0, 1.0, 1000000)`,
            [aiTeamId]
          );
          
          // 미디어실 생성 (레벨 1)
          await conn.query(
            `INSERT INTO media_rooms (team_id, level, awareness_bonus, fan_growth_bonus, monthly_maintenance_cost)
             VALUES (?, 1, 2.0, 1.0, 1000000)`,
            [aiTeamId]
          );
        } catch (facilityError) {
          console.error(`AI 팀 ${aiTeamId} 시설 생성 오류:`, facilityError);
        }
        
        // AI 팀에 선수 배정 (포지션별 2명씩)
        const positions = ['TOP', 'JGL', 'MID', 'ADC', 'SPT'];
        for (const position of positions) {
          for (let j = 0; j < 2; j++) {
            const playerName = this.generateRandomPlayerName();
            const age = 15 + Math.floor(Math.random() * 8); // 15-22
            const overall = 40 + Math.floor(Math.random() * 20); // 40-60
            const potential = this.calculatePotentialByAge(age);
            
            await conn.query(
              `INSERT INTO players (
                team_id, name, position, nationality, age, overall, potential,
                mental, teamfight, laning, jungling, cs_skill, \`condition\`,
                leadership, will, competitiveness, dirty_play,
                is_ai, salary
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
              [
                aiTeamId, playerName, position, 'KOR', age, overall, potential,
                40 + Math.floor(Math.random() * 20), // mental
                40 + Math.floor(Math.random() * 20), // teamfight
                40 + Math.floor(Math.random() * 20), // laning
                40 + Math.floor(Math.random() * 20), // jungling
                40 + Math.floor(Math.random() * 20), // cs_skill
                80 + Math.floor(Math.random() * 20), // condition
                40 + Math.floor(Math.random() * 20), // leadership
                50 + Math.floor(Math.random() * 30), // will
                50 + Math.floor(Math.random() * 30), // competitiveness
                10 + Math.floor(Math.random() * 20), // dirty_play
                0 // AI 팀 선수는 무급
              ]
            );
          }
        }
      }
      
      return { message: `${neededTeams}개의 AI 팀이 생성되었습니다.` };
    } catch (error) {
      console.error('AI 팀 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 랜덤 영어 선수 이름 생성
  static generateRandomPlayerName() {
    const firstNames = [
      'Shadow', 'Storm', 'Blade', 'Phoenix', 'Dragon', 'Thunder', 'Viper', 'Falcon',
      'Wolf', 'Tiger', 'Lion', 'Eagle', 'Hawk', 'Raven', 'Cobra', 'Panther',
      'Blaze', 'Frost', 'Nova', 'Ace', 'Dash', 'Flash', 'Swift', 'Spike'
    ];
    
    const lastNames = [
      'Hunter', 'Slayer', 'Master', 'King', 'Lord', 'Knight', 'Warrior', 'Legend',
      'Pro', 'Star', 'Hero', 'Ace', 'Elite', 'Prime', 'Alpha', 'Omega'
    ];
    
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${first}${last}`;
  }
  
  // 나이에 따른 포텐셜 계산
  static calculatePotentialByAge(age) {
    if (age >= 20) {
      // 20세 이상: 낮은 포텐셜 (80-85)
      return 80 + Math.floor(Math.random() * 6);
    } else if (age >= 18) {
      // 18-19세: 중간 포텐셜 (86-90)
      return 86 + Math.floor(Math.random() * 5);
    } else if (age >= 16) {
      // 16-17세: 높은 포텐셜 (91-96)
      return 91 + Math.floor(Math.random() * 6);
    } else {
      // 15세: 최고 포텐셜 (94-99)
      return 94 + Math.floor(Math.random() * 6);
    }
  }
  
  // 리그 스케줄 생성 (홈/어웨이)
  static async generateLeagueSchedule(leagueId) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 리그의 모든 팀 조회
      const teams = await conn.query(
        'SELECT id FROM teams WHERE league_id = ? ORDER BY id',
        [leagueId]
      );
      
      if (teams.length < 2) {
        throw new Error('최소 2개 팀이 필요합니다.');
      }
      
      // 현재 게임 시간 조회
      const [gameTime] = await conn.query('SELECT * FROM game_time WHERE id = 1');
      const seasonYear = gameTime.current_year;
      
      // 기존 스케줄 삭제 (season_year 컬럼이 있으면 사용, 없으면 전체 삭제)
      try {
        await conn.query(
          'DELETE FROM matches WHERE league_id = ? AND season_year = ?',
          [leagueId, seasonYear]
        );
      } catch (error) {
        // season_year 컬럼이 없으면 전체 삭제
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          await conn.query(
            'DELETE FROM matches WHERE league_id = ?',
            [leagueId]
          );
        } else {
          throw error;
        }
      }
      
      // 라운드 로빈 방식으로 스케줄 생성 (홈/어웨이)
      const teamIds = teams.map(t => t.id);
      const numTeams = teamIds.length;
      const matches = [];
      
      // 첫 번째 라운드: 각 팀이 다른 모든 팀과 홈에서 경기
      for (let i = 0; i < numTeams; i++) {
        for (let j = i + 1; j < numTeams; j++) {
          matches.push({
            home: teamIds[i],
            away: teamIds[j]
          });
        }
      }
      
      // 두 번째 라운드: 홈/어웨이 반대
      for (let i = 0; i < numTeams; i++) {
        for (let j = i + 1; j < numTeams; j++) {
          matches.push({
            home: teamIds[j],
            away: teamIds[i]
          });
        }
      }
      
      // 매치를 날짜에 배정 (3월부터 시작)
      let matchDate = new Date(seasonYear, 2, 1); // 3월 1일
      
      for (const match of matches) {
        // season_year 컬럼이 있는지 확인
        const columns = await conn.query('SHOW COLUMNS FROM matches LIKE "season_year"');
        const hasSeasonYear = columns.length > 0;
        
        if (hasSeasonYear) {
          await conn.query(
            `INSERT INTO matches (
              league_id, home_team_id, away_team_id, match_date, 
              season_year, status
            ) VALUES (?, ?, ?, ?, ?, 'scheduled')`,
            [leagueId, match.home, match.away, matchDate.toISOString().split('T')[0], seasonYear]
          );
        } else {
          await conn.query(
            `INSERT INTO matches (
              league_id, home_team_id, away_team_id, match_date, 
              status
            ) VALUES (?, ?, ?, ?, 'scheduled')`,
            [leagueId, match.home, match.away, matchDate.toISOString().split('T')[0]]
          );
        }
        
        // 다음 경기일 (3일 후)
        matchDate.setDate(matchDate.getDate() + 3);
      }
      
      // 리그 순위 초기화
      await this.initializeLeagueStandings(leagueId, seasonYear);
      
      return { 
        message: '스케줄이 생성되었습니다.',
        totalMatches: matches.length 
      };
    } catch (error) {
      console.error('스케줄 생성 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 리그 순위 초기화
  static async initializeLeagueStandings(leagueId, seasonYear) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const teams = await conn.query(
        'SELECT id FROM teams WHERE league_id = ?',
        [leagueId]
      );
      
      // 기존 순위 데이터 삭제
      await conn.query(
        'DELETE FROM league_standings WHERE league_id = ? AND season_year = ?',
        [leagueId, seasonYear]
      );
      
      // 각 팀의 순위 데이터 초기화
      for (const team of teams) {
        await conn.query(
          `INSERT INTO league_standings (
            league_id, team_id, season_year, wins, losses, draws, 
            points, goals_for, goals_against, goal_difference, rank
          ) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
          [leagueId, team.id, seasonYear]
        );
      }
      
      return { message: '리그 순위가 초기화되었습니다.' };
    } catch (error) {
      console.error('순위 초기화 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 유저 팀이 리그에 참가할 때 AI 팀 대체 (언제든지 가능)
  static async replaceAITeamWithUser(leagueId, userId, teamName, abbreviation, logoPath) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 리그에서 AI 팀 찾기 (is_ai = TRUE 또는 user_id IS NULL)
      const aiTeams = await conn.query(
        `SELECT id FROM teams 
         WHERE league_id = ? AND (is_ai = TRUE OR user_id IS NULL)
         ORDER BY id ASC 
         LIMIT 1`,
        [leagueId]
      );
      
      if (!aiTeams || aiTeams.length === 0) {
        throw new Error('대체할 AI 팀이 없습니다.');
      }
      
      const aiTeam = aiTeams[0];
      const aiTeamId = aiTeam.id;
      
      // AI 팀의 모든 선수 삭제
      await conn.query('DELETE FROM players WHERE team_id = ?', [aiTeamId]);
      
      // AI 팀의 시설 정보는 유지 (경기장, 숙소 등)
      
      // AI 팀을 유저 팀으로 변경
      const columns = await conn.query('SHOW COLUMNS FROM teams LIKE "is_ai"');
      const hasIsAi = columns.length > 0;
      
      if (hasIsAi) {
        await conn.query(
          `UPDATE teams 
           SET user_id = ?, name = ?, abbreviation = ?, logo_path = ?, is_ai = FALSE
           WHERE id = ?`,
          [userId, teamName, abbreviation, logoPath, aiTeamId]
        );
      } else {
        await conn.query(
          `UPDATE teams 
           SET user_id = ?, name = ?, abbreviation = ?, logo_path = ?
           WHERE id = ?`,
          [userId, teamName, abbreviation, logoPath, aiTeamId]
        );
      }
      
      console.log(`AI 팀 ${aiTeamId}가 유저 팀으로 대체되었습니다.`);
      
      return { 
        message: 'AI 팀이 유저 팀으로 대체되었습니다.',
        teamId: aiTeamId 
      };
    } catch (error) {
      console.error('AI 팀 대체 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  // 모든 리그에 AI 팀 자동 생성 (서버 시작 시 호출)
  static async initializeAllLeaguesWithAITeams() {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 모든 리그 조회
      const leagues = await conn.query('SELECT * FROM leagues ORDER BY id');
      
      let totalCreated = 0;
      
      for (const league of leagues) {
        // 현재 팀 수 확인
        const teamCount = await conn.query(
          'SELECT COUNT(*) as count FROM teams WHERE league_id = ?',
          [league.id]
        );
        
        // BigInt를 Number로 명시적 변환
        const currentTeams = Number(teamCount[0].count);
        const maxTeams = Number(league.max_teams);
        const neededTeams = maxTeams - currentTeams;
        
        if (neededTeams > 0) {
          console.log(`리그 ${league.id} (${league.name})에 ${neededTeams}개의 AI 팀 생성 중...`);
          await this.fillLeagueWithAITeams(league.id);
          totalCreated += Number(neededTeams);
        }
      }
      
      console.log(`✅ 총 ${totalCreated}개의 AI 팀이 생성되었습니다.`);
      return { message: `총 ${totalCreated}개의 AI 팀이 생성되었습니다.`, totalCreated };
    } catch (error) {
      console.error('리그 초기화 오류:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = LeagueService;

