import { Trans } from 'react-i18next'
import styled from 'styled-components'
import animate from './ui/animate'

export default () => {
	return (
		<animate.appear>
			<AlertBanner>
				<p
					css={`
						margin: 0;
					`}
				>
					<Trans i18nKey={'components.TranslationAlertBanner.wikiLink'}>
						La traduction de cette page est en version <strong>beta</strong>.{' '}
						<a href="/contribuer-traduction">Un problème, une suggestion ?</a>
					</Trans>
				</p>
			</AlertBanner>
		</animate.appear>
	)
}

const AlertBanner = styled.div`
	background-color: #f1f1f9;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: calc(100% - 0.4rem);
	margin-bottom: 0.6rem;
	margin-right: 0.4rem;
	border-radius: 0.3rem;
	padding: 0.3rem 1rem;
	text-align: center;

	@media (min-width: 800px) {
		margin: 0;
		padding: 0.3rem 0.6rem;
	}
`
