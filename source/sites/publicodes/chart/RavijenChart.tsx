import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
	extractCategories,
	getSubcategories,
	relegateCommonCategories,
} from '../../../components/publicodesUtils'
import { useEngine } from '../../../components/utils/EngineContext'

import { capitalise0, utils } from 'publicodes'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useElementSize } from 'usehooks-ts'
import SafeCategoryImage from '../../../components/SafeCategoryImage'
import { humanWeight } from '../HumanWeight'
import { getTitle, groupTooSmallCategories } from './chartUtils'

// This component was named in the honor of http://ravijen.fr/?p=440

export default ({
	target = 'bilan',
	numberBottomRight, // This saves space, but is less visually attractive. Hence activated for the more technical "services sociétaux" graph, not for the main graph
	verticalReverse,
	noLinks,
}) => {
	const { t, i18n } = useTranslation()
	const rules = useSelector((state) => state.rules)
	const engine = useEngine()
	const sortedCategories = extractCategories(rules, engine, null, target).map(
		(category) => ({
			...category,
			abbreviation: rules[category.dottedName].abréviation,
		})
	)

	const categories =
		target === 'bilan'
			? relegateCommonCategories(sortedCategories)
			: sortedCategories

	if (!categories) return null

	const empreinteTotale = categories.reduce(
			(memo, next) => next.nodeValue + memo,
			0
		),
		empreinteMax = categories.reduce(
			(memo, next) => (next.nodeValue > memo.nodeValue ? next : memo),
			{ nodeValue: -Infinity }
		)

	const barWidthPercent = 100 / categories.length
	return (
		<ol
			css={`
				margin: 0;
				min-width: 30rem;
				height: 100%;
				padding: 0;
				border: 2px solid white;
				display: flex;
				justify-content: center;
				align-items: end;
			`}
			title={t('Explorer les catégories')}
		>
			{categories.map((category, index) => {
				const [value, unit] = humanWeight(
					{ t, i18n },
					category.nodeValue,
					false
				)
				const ratio = category.nodeValue / empreinteMax.nodeValue
				return (
					<li
						key={category.title}
						title={`${category.title} : ${Math.round(
							(category.nodeValue / empreinteTotale) * 100
						)}%`}
						css={`
							width: calc(${barWidthPercent}% - 0.8rem);
							margin: 0 0.4rem;
							list-style-type: none;
							height: 100%;
							display: flex;
							flex-direction: column;
							justify-content: ${verticalReverse ? 'start' : 'end'};
						`}
					>
						<div
							css={`
								--availableHeight: calc(100% - 7rem);
								height: calc(${ratio} * var(--availableHeight));
							`}
						>
							<SubCategoriesVerticalBar
								{...{
									noLinks,
									category,
									engine,
									rules,
									numberBottomRight,
									verticalReverse,
									ratio,
								}}
							/>
						</div>
						<ConditionalLink
							active={!noLinks}
							css={`
								${verticalReverse && ` order: -1;`}
							`}
							to={`/documentation/${utils.encodeRuleName(category.dottedName)}`}
						>
							<div
								css={`
									height: 7rem;
									margin-top: 0.4rem;
									background: var(--color) !important;
									> span > img {
										height: 2.5rem;
										width: 2.5rem;
										${category.nodeValue / empreinteMax.nodeValue < 0.1 &&
										'width: 1.5rem'}
									}
									h3 {
										font-size: 100%;
										color: white;
										margin: 0;
									}
									text-align: center;
									padding: 0.6rem 0;
									color: white;
								`}
							>
								<SafeCategoryImage element={category} />
								<h3>
									{category.title.length < 12
										? category.title
										: capitalise0(category.abbreviation)}
								</h3>
								{value}&nbsp;{unit}
							</div>
						</ConditionalLink>
					</li>
				)
			})}
		</ol>
	)
}

const SubCategoriesVerticalBar = ({
	rules,
	category,
	engine,
	numberBottomRight,
	verticalReverse,
	noLinks,
	ratio,
}) => {
	const { t, i18n } = useTranslation()
	const categories = getSubcategories(rules, category, engine, true)

	const [barRef, { width, height }] = useElementSize()
	const [detailsShown, showDetails] = useState(false)

	const maximumBarHeightPixels = 30,
		maximumBarHeightRatio = maximumBarHeightPixels / height

	const { rest, restWidth, bigEnough, total } = groupTooSmallCategories(
		categories,
		maximumBarHeightRatio
	)

	const reverseOrNot = (list) => (verticalReverse ? list : list.reverse())

	console.log('rW', restWidth)

	const Other = () =>
		restWidth > 0 && detailsShown ? (
			<>
				<button
					onClick={() => showDetails(false)}
					css="img {width:2rem}; display: block;  margin: 1rem auto 0"
				>
					<img src="/images/burger-menu.svg" />
				</button>
				<ul
					css={`
						height: ${100}%;
						padding: 0;
						li {
							list-style-type: none;
							z-index: 1;
							background: white;
							position: relative;
						}
					`}
				>
					{rest.categories.map((restCategory) => (
						<li
							css={`
								height: calc(2rem + ${(restCategory.nodeValue / total) * 100}%);
							`}
						>
							<div
								css={`
									display: flex;
									align-items: center;
									justify-content: space-between;
									height: 2rem;
								`}
							>
								<span css="max-width: 70%; overflow: auto; display: inline-block; white-space: nowrap;">
									{getTitle(restCategory.title)}
								</span>
								<small>{Math.round(restCategory.nodeValue)} kg</small>
							</div>
							<div
								css={`
									height: calc(100% - 2rem);
									min-height: 1px;
									background: ${category.color};
								`}
							></div>
						</li>
					))}
				</ul>
			</>
		) : (
			<VerticalBarFragment
				{...{
					onClick: () => showDetails(true),
					label: restWidth < 5 ? '...' : 'Autres',
					title: t('Le reste : ') + rest.labels.join(', '),
					nodeValue: rest.value,
					dottedName: 'rest',
					heightPercentage: restWidth,
					compact: true,
					numberBottomRight,
					color: category.color,
				}}
			/>
		)
	const List = () =>
		reverseOrNot(bigEnough).map(
			({ nodeValue, title, abbreviation, icons, color, dottedName }) => {
				const titleWithoutPercent = getTitle(title)
				return (
					<ConditionalLink
						active={!noLinks}
						to={`/documentation/${utils.encodeRuleName(dottedName)}`}
					>
						<VerticalBarFragment
							{...{
								label:
									(abbreviation && capitalise0(abbreviation)) ||
									titleWithoutPercent,
								title:
									(abbreviation && capitalise0(abbreviation)) ||
									titleWithoutPercent,
								nodeValue,
								dottedName,
								heightPercentage: (nodeValue / total) * 100,
								icons,
								numberBottomRight,
								color: category.color,
							}}
						/>
					</ConditionalLink>
				)
			}
		)
	return (
		<ol
			css={`
				height: 100%;
				list-style-type: none;
				padding-left: 0;
				a {
					text-decoration: none;
				}
			`}
			ref={barRef}
		>
			{verticalReverse ? (
				<>
					<List /> <Other />
				</>
			) : (
				<>
					<Other /> <List />
				</>
			)}
		</ol>
	)
}

const VerticalBarFragment = ({
	title,
	label,
	nodeValue,
	dottedName,
	heightPercentage,
	compact,
	numberBottomRight,
	color,
	onClick,
}) => {
	const { t, i18n } = useTranslation()
	const [value, unit] = humanWeight({ t, i18n }, nodeValue, false)
	const [hidden, setHidden] = useState({})

	const [ref, { width, height }] = useElementSize()

	console.log(dottedName, height)
	useEffect(() => {
		if (!height) return
		if (height < 80 && !hidden.value) {
			setHidden({ value: true, largeImage: true })
			return
		}
		if (height < 50 && !hidden.inline) {
			setHidden({ value: true, inline: true, largeImage: true })
			return
		}
		if (height < 30 && !hidden.label) {
			setHidden({ value: true, inline: true, label: true, largeImage: true })
			return
		}
	}, [height, hidden])
	console.log(dottedName, hidden.inline)
	return (
		<li
			onClick={onClick}
			css={`
				cursor: pointer;
				text-align: center;
				margin: 0;
				height: ${heightPercentage}%;
				background: ${color};
				color: white;
				strong {
					color: inherit;
					display: flex;
					align-items: center;
					justify-content: center;
					line-height: 1.2rem;
				}
				position: relative;
				small {
					${numberBottomRight &&
					`
					position: absolute;
					bottom: 0.2rem;
					right: 0.3rem;
					`}
					color: inherit;
					line-height: 1rem;
				}
				border-top: 1px solid white;
				display: flex;
				flex-direction: ${hidden.inline ? 'row' : 'column'};
				justify-content: center;
				img {
					width: 2rem;
					${hidden.largeImage && `width: 1.6rem`};
					${compact ? 'height: 1rem' : 'height: auto'}
				}
			`}
			ref={ref}
			key={dottedName}
			title={`${title} : ${value} ${unit}`}
		>
			<SafeCategoryImage element={{ dottedName }} voidIfFail={!compact} />

			{!hidden.label && <strong>{label}</strong>}
			{(!hidden.value || numberBottomRight) && (
				<small>
					{value}&nbsp;{unit}
				</small>
			)}
		</li>
	)
}
const ConditionalLink = ({ active, ...props }) =>
	active ? <Link {...props} /> : <span>{props.children}</span>
