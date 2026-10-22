/**
 * Phase 1: Hardcoded template interpolation (no API)
 * Interpolates the form state into a structured cover letter template string.
 */
export function generateTemplateCoverLetter({ candidateName, jobRole, targetCompany, keySkills, resumeText }) {
  const name = candidateName?.trim() || '[Your Name]';
  const role = jobRole?.trim() || '[Target Job Role]';
  const company = targetCompany?.trim() || '[Target Company]';
  const skills = keySkills?.trim() || 'relevant technical skills, project management, and collaborative problem-solving';
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const resumeHighlight = resumeText && resumeText.trim()
    ? `Based on my background detailed in my attached resume, I have developed a strong foundation in practical execution, continuous learning, and cross-functional leadership. Specifically, my experience aligns closely with what you are seeking for the ${role} position.\n\nKey resume summary:\n${resumeText.slice(0, 320).trim()}...\n\nThese achievements have prepared me to make an immediate, meaningful impact from day one.`
    : `Throughout my professional career, I have dedicated myself to mastering ${skills}. I take pride in delivering measurable results, adapting quickly to evolving requirements, and working effectively across diverse teams. My strengths in these core competencies directly match the qualifications needed to thrive at ${company}.`;

  return `${today}

Dear Hiring Team at ${company},

I am writing to enthusiastically submit my application for the ${role} position at ${company}. With my background and demonstrable expertise in ${skills}, I am eager to bring my passion and experience to your growing team.

${resumeHighlight}

I have long admired ${company}'s standard of quality, culture, and positive momentum in the industry. The prospect of contributing to your team's ongoing initiatives as a ${role} is an exciting opportunity that perfectly matches my career goals and values.

Thank you for your time, consideration, and review of my application materials. I look forward to the possibility of an interview to discuss how my qualifications will support ${company}'s upcoming milestones.

Warm regards,

${name}`;
}
