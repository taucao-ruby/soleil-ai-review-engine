export interface SkillSource {
  readonly kind: 'file' | 'directory';
  readonly relativePath: string;
}

export interface SkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly source: SkillSource;
}

export interface SkillPack {
  readonly id: string;
  readonly version: string;
  readonly skills: readonly SkillDefinition[];
}
