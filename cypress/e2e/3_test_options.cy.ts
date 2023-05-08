describe('Test Isoform Inspector options', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.visit('/?config=loaded.json')
    // open file screen successfully loads
    cy.contains('Opening file for: PSME4')

    // loads a file it selects
    cy.get('[data-testid=isoform-file-select]').selectFile(
      'cypress/fixtures/test_subj_observ.json',
      { force: true },
    )
    cy.get('#select-multiple-native').select(['test_subj_observ.json'])
    cy.contains('Submit').click()
    cy.contains('Splice junction read counts (raw)')
  })
  it('hides Rows with no reads', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Heatmap...').click().type('{rightArrow}{rightArrow}{enter}')
    cy.contains('Rows with no reads have been hidden on the heatmap')
  })
  it('hides Columns with no reads', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Heatmap...').click().type('{rightArrow}{downArrow}{enter}')
    cy.contains('Columns with no reads have been hidden on the heatmap')
  })
  it('toggles to normalized reads', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Toggle to normalized reads').click()
    cy.contains('(normalized)')
  })
  it('toggles to exon data using the menu', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Toggle to exon mode').click()
    cy.contains('Canonical exon read counts (raw)')
  })
  it('toggles back to raw reads', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Toggle to normalized reads').click()
    cy.contains('(normalized)')
    cy.get('[data-testid=view_menu_icon').eq(1).click()
    cy.contains('Toggle to raw reads').click()
    cy.contains('(raw)')
  })
  it('hides the canonical exons', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Gene model...').click()
    cy.contains('Hide canonical exons').click()
    cy.contains('Canonical exon model has been hidden')
  })
  it('hides the exon coverage plot', () => {
    cy.get('[data-testid=view_menu_icon]').eq(1).click()
    cy.contains('Gene model...').click()
    cy.contains('Hide exon coverage plot').click()
    cy.contains('Canonical exon coverage plot has been hidden')
  })
  it('toggles to junction data using the button', () => {
    cy.get('[data-testid=toggle-exon').click({ force: true })
    cy.contains('Canonical exon read counts (raw)')
  })
})
